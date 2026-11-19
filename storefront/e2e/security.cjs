// Security checks over plain HTTP.
// BASE_URL: server with no password (local mode). BASE_URL_PW: server started with OWNER_PASSWORD=$OWNER_PASSWORD.
const http = require("http");
const { ok, assert } = require("./helpers.cjs");
const B = process.env.BASE_URL || "http://localhost:3100";
const BP = process.env.BASE_URL_PW || "http://localhost:3101";
const PW = process.env.OWNER_PASSWORD;

const req = (url, init = {}) => fetch(url, { redirect: "manual", ...init });
const post = (url, body, headers = {}) => req(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

/** fetch() can't fake the Host header, so use http directly. */
function getWithHost(url, host, extra = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    http.get({ hostname: u.hostname, port: u.port, path: u.pathname, headers: { host, ...extra } }, (res) => {
      res.resume();
      resolve(res.statusCode);
    }).on("error", reject);
  });
}

(async () => {
  // ---- headers
  const home = await req(B + "/");
  const h = home.headers;
  assert(h.get("content-security-policy")?.includes("frame-ancestors 'none'"), "CSP with frame-ancestors");
  assert(h.get("x-frame-options") === "DENY" && h.get("x-content-type-options") === "nosniff", "frame + nosniff headers");
  assert(!h.get("x-powered-by"), "no x-powered-by");
  ok("security headers present, framework not advertised");

  // ---- local mode: owner app refuses to open from another address
  assert((await getWithHost(B + "/api/admin/db", "localhost:3100")) === 200, "owner API opens on localhost");
  assert((await getWithHost(B + "/api/admin/db", "myshop.example.com")) === 403, "owner API must refuse other hosts without a password");
  assert((await getWithHost(B + "/dashboard", "myshop.example.com")) === 403, "dashboard must refuse other hosts without a password");
  assert((await req(B + "/api/admin/db", { headers: { "x-forwarded-for": "203.0.113.9" } })).status === 403, "proxied requests count as remote");
  assert((await req(B + "/api/admin/db", { headers: { "x-forwarded-for": "127.0.0.1, 203.0.113.9" } })).status === 403, "a proxy appending the real address counts as remote");
  assert((await getWithHost(B + "/api/admin/db", "myshop.example.com", { "x-forwarded-host": "localhost" })) === 403, "a spoofed forwarded host must not unlock the owner app");
  ok("without a password the owner app only opens on this computer");

  // ---- CSRF: writes from another site are refused
  const db = await (await req(B + "/api/admin/db")).json();
  const bad = await req(B + "/api/admin/db", { method: "PUT", headers: { "content-type": "application/json", origin: "https://evil.example" }, body: JSON.stringify({ baseRev: db.rev, stores: [] }) });
  assert(bad.status === 403, `cross-site PUT should be 403, got ${bad.status}`);
  const after = await (await req(B + "/api/admin/db")).json();
  assert(after.stores.length === db.stores.length, "cross-site PUT must not change data");
  ok("cross-site writes refused (CSRF)");

  // ---- stale writes are refused instead of overwriting newer data
  const stale = await req(B + "/api/admin/db", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ baseRev: db.rev - 1, stores: db.stores }) });
  assert(stale.status === 409, `stale save should be 409, got ${stale.status}`);
  ok("stale saves get a conflict, not an overwrite");

  // ---- shopper input: the server prices everything itself
  const store = db.stores.find((s) => s.published);
  assert(store, "need a published store from earlier suites");
  const p = store.products.find((x) => x.status === "active" && x.stock > 1);
  const base = `${B}/api/public/stores/${store.slug}`;
  const customer = { name: "Eve", email: "eve@test.dev", address: "1 St", city: "X", zip: "1", country: "US" };
  const pay = { method: "card", number: "4242424242424242", expiry: "12/30", cvc: "123" };
  const tampered = await post(`${base}/order`, { lines: [{ productId: p.id, qty: 1, unitCents: 1, priceCents: 1 }], customer, payment: pay, visitor: "visitorabc", total: 1, exposed: [], forced: {} });
  const order = (await tampered.json()).order;
  assert(tampered.status === 200 && order.items[0].unitCents !== 1 && order.totalCents > 1, "server must ignore client-sent prices");
  ok(`price tampering ignored (charged ${order.totalCents}¢, not 1¢)`);

  for (const [what, body] of [
    ["qty 1000", { lines: [{ productId: p.id, qty: 1000 }], customer, payment: pay, visitor: "visitorabc" }],
    ["bad email", { lines: [{ productId: p.id, qty: 1 }], customer: { ...customer, email: "x" }, payment: pay, visitor: "visitorabc" }],
    ["unknown product", { lines: [{ productId: "nope", qty: 1 }], customer, payment: pay, visitor: "visitorabc" }],
    ["fake discount", { lines: [{ productId: p.id, qty: 1 }], customer, payment: pay, visitor: "visitorabc", code: "FREE100" }],
  ]) {
    const r = await post(`${base}/order`, body);
    if (what === "fake discount") {
      const o = (await r.json()).order;
      assert(r.status === 200 && o.discountCents === 0, "unknown discount code must not discount");
    } else assert(r.status === 400, `${what} should be rejected, got ${r.status}`);
  }
  const huge = await post(`${base}/subscribe`, { email: "a@b.co", pad: "x".repeat(50_000) });
  assert(huge.status === 400, "oversized body rejected");
  const evilReview = await post(`${base}/review`, { productId: p.id, author: "<script>alert(1)</script>", rating: 9, body: "hi there" });
  assert(evilReview.status === 400, "rating out of range rejected");
  ok("bad quantities, emails, products, codes, ratings and oversized bodies rejected");

  // ---- rate limiting on public writes
  let limited = false;
  for (let i = 0; i < 40 && !limited; i++) limited = (await post(`${base}/subscribe`, { email: `r${i}@test.dev` })).status === 429;
  assert(limited, "public writes are rate limited");
  ok("public writes are rate limited");

  // ---- password mode
  if (PW) {
    const d = await req(BP + "/dashboard");
    assert(d.status === 307 && d.headers.get("location").includes("/login"), `dashboard should redirect to /login, got ${d.status}`);
    assert((await req(BP + "/api/admin/db")).status === 401, "admin API needs a session");
    assert((await req(BP + "/api/admin/db", { headers: { cookie: "owner_session=v1.99999999999999.forged" } })).status === 401, "forged cookie rejected");
    const good = await post(BP + "/api/auth/login", { password: PW });
    assert(good.status === 200, "correct password signs in");
    const cookie = good.headers.get("set-cookie");
    assert(/HttpOnly/i.test(cookie) && /SameSite=Strict/i.test(cookie), "session cookie is HttpOnly + SameSite=Strict");
    const session = cookie.split(";")[0];
    assert((await req(BP + "/api/admin/db", { headers: { cookie: session } })).status === 200, "session opens the admin API");
    assert((await req(BP + "/dashboard", { headers: { cookie: session } })).status === 200, "session opens the dashboard");
    // tampered session (change the expiry, keep the signature)
    const [v, exp, sig] = session.split("=")[1].split(".");
    assert((await req(BP + "/api/admin/db", { headers: { cookie: `owner_session=${v}.${Number(exp) + 1}.${sig}` } })).status === 401, "tampered session rejected");
    let statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await post(BP + "/api/auth/login", { password: "wrong-" + i })).status);
    assert(statuses.slice(0, 4).every((s) => s === 401) && statuses.includes(429), `wrong passwords locked out: ${statuses}`);
    ok("password mode: login required, forged/tampered sessions rejected, guessing locked out after 5 tries");
  }
})().catch((e) => {
  console.error("FAIL", e.message);
  process.exit(1);
});

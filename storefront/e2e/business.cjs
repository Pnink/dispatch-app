// Payments (Stripe), profit, tracking and policies. Runs against a server with STRIPE_FAKE=1 and MAIL_FAKE=1
// (BASE_URL), so the whole flow runs with nothing sent to Stripe or any email service.
const crypto = require("crypto");
const { chromium } = require("playwright");
const { B, ok, assert, adminDb, waitSaved, createStore, collectErrors } = require("./helpers.cjs");
const OUT = process.argv[2];
const WH_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_e2e";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  collectErrors(page, errors);
  page.on("dialog", (d) => d.accept());
  const shot = (n) => OUT && page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
  const db = async () => (await adminDb(page)).stores.find((s) => s.slug === slug);

  const slug = await createStore(page, "Hand-poured soy candles in amber jars", "homeware");
  let s = await db();
  const product = s.products.find((p) => p.status === "active");

  // 1. costs → profit per sale
  await page.goto(`${B}/dashboard/settings#payments`);
  await page.locator("[data-stripe=test]").waitFor();
  await page.getByText("Stripe test mode.").waitFor();
  await page.getByLabel("Supplier shipping per order (USD)").fill("4.00");
  await page.getByLabel("Supplier shipping per order (USD)").blur();
  await waitSaved(page);
  await page.goto(`${B}/dashboard/products`);
  await page.getByRole("button", { name: `Edit ${product.title}` }).click();
  await page.getByLabel("Your cost (USD)").fill("8.00");
  await page.locator("[data-editor-profit]").waitFor();
  await page.getByRole("dialog").getByRole("button", { name: /^Save/ }).click();
  await waitSaved(page);
  s = await db();
  assert(s.products.find((p) => p.id === product.id).costCents === 800, "product cost saved");
  assert(s.costs.supplierShippingCents === 400, "supplier shipping saved");
  const fee = Math.round(product.priceCents * 0.029) + 30;
  const expected = product.priceCents - 800 - 400 - fee;
  const shown = await page.locator("[data-unit-profit]").first().innerText();
  assert(shown.includes((expected / 100).toFixed(2)), `profit per sale shown (${shown}, expected ${expected})`);
  ok(`profit per sale: price − cost − supplier shipping − fee = ${(expected / 100).toFixed(2)}`);

  // 2. costs and pending checkouts never reach shoppers
  const pub = await page.evaluate(async (sl) => (await fetch(`/api/public/stores/${sl}`)).json(), slug);
  assert(pub.checkout === "stripe-test", "storefront knows payments run through Stripe (test)");
  assert(!JSON.stringify(pub).includes("costCents") && !("costs" in pub) && !("pending" in pub), "costs/pending are private");
  ok("supplier costs and pending checkouts are private");

  // 3. checkout → Stripe → back → order recorded
  await page.goto(`${B}/store/${slug}/p/${product.id}`);
  await page.getByRole("dialog").waitFor({ timeout: 4000 }).then(() => page.keyboard.press("Escape")).catch(() => {});
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto(`${B}/store/${slug}/checkout`);
  await page.locator("[data-checkout-mode=stripe-test]").waitFor();
  assert(!(await page.getByLabel("Card number").count()), "no card fields on our page: cards go to Stripe");
  for (const [l, v] of [["Email", "buyer@test.dev"], ["Full name", "Robin Buyer"], ["Address", "1 Test Lane"], ["City", "Austin"], ["Postal code", "78701"]]) await page.getByLabel(l).fill(v);
  await shot("B01-checkout-stripe");
  await page.getByRole("button", { name: /Continue to payment/ }).click();
  await page.waitForURL(/\/order\/(?!confirm)[0-9a-f-]{36}/, { timeout: 20000 });
  await page.getByText(/Thank you, Robin/).waitFor();
  s = await db();
  const order = s.orders[0];
  assert(order.payment?.provider === "stripe" && order.payment.session.startsWith("cs_test_fake_"), "order paid through Stripe");
  assert(order.costCents === 800 + 400, "order records your cost");
  assert(s.pending.length === 0, "pending checkout cleared");
  assert(s.products.find((p) => p.id === product.id).stock === product.stock - 1, "stock reduced");
  const cart = await page.evaluate((sl) => localStorage.getItem(`sf:cart:${sl}`), slug);
  assert(!cart || cart === "[]", "cart emptied after payment");
  ok("checkout → Stripe → confirmed order with cost, stock and cart updated");

  // 4. the webhook records orders too, signed, and never twice
  const start = await page.evaluate(
    async ({ sl, pid }) =>
      (await fetch(`/api/public/stores/${sl}/order`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines: [{ productId: pid, qty: 1 }], customer: { name: "Webhook Buyer", email: "wh@test.dev", address: "2 Hook Rd", city: "Reno", zip: "89501", country: "US" }, visitor: "visitorwebhook1", exposed: [], forced: {} }),
      })).json(),
    { sl: slug, pid: product.id },
  );
  const sid = new URL(start.redirect).searchParams.get("session_id");
  const payload = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: sid, metadata: { slug } } } });
  const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac("sha256", WH_SECRET).update(`${t}.${payload}`).digest("hex");
  const send = (header) => page.evaluate(async ({ body, header }) => (await fetch("/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": header }, body })).status, { body: payload, header });
  assert((await send(`t=${t},v1=${"0".repeat(64)}`)) === 400, "forged webhook rejected");
  assert((await send(`t=${t - 3600},v1=${sig}`)) === 400, "old (replayed) webhook rejected");
  assert((await send(`t=${t},v1=${sig}`)) === 200, "signed webhook accepted");
  await page.goto(`${B}/store/${slug}/order/confirm?session_id=${sid}`); // shopper comes back after the webhook
  await page.waitForURL(/\/order\/(?!confirm)/);
  s = await db();
  assert(s.orders.filter((o) => o.payment?.session === sid).length === 1, "recorded exactly once (webhook + return)");
  const unpaid = await page.evaluate(async (sl) => (await fetch(`/api/public/stores/${sl}/confirm`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ session: "cs_test_madeup123456" }) })).status, slug);
  assert(unpaid >= 400, "made-up checkout id can't create an order");
  ok("Stripe webhook: forged/old signatures rejected, real one records the order, never twice");

  // 5. profit in the owner app; tracking number → shipped + customer email
  await page.goto(`${B}/dashboard/orders?id=${order.id}`);
  const dlg = page.getByRole("dialog", { name: `Order ${order.number}` });
  await dlg.getByRole("region", { name: "Profit" }).getByText("You made").waitFor();
  await page.locator("[data-total-profit]").waitFor();
  await dlg.getByLabel("Tracking number from your supplier").fill("1Z999AA10123456784");
  await dlg.getByRole("button", { name: /Add tracking/ }).click();
  await dlg.locator("[data-tracking-emailed=yes]").waitFor();
  await dlg.getByText("UPS").first().waitFor();
  await shot("B02-order-profit-tracking");
  s = await db();
  const tracked = s.orders.find((o) => o.id === order.id);
  assert(tracked.status === "fulfilled" && tracked.tracking.carrier === "UPS" && tracked.tracking.url.includes("ups.com"), "tracking saved, carrier detected, marked shipped");
  ok("tracking: UPS detected, order marked shipped, customer emailed");

  // 6. customers look up their order (number + the right email)
  await page.goto(`${B}/store/${slug}/track`);
  await page.getByLabel("Order number").fill(String(order.number));
  await page.getByLabel("Email").fill("someone.else@test.dev");
  await page.getByRole("button", { name: "Find my order" }).click();
  await page.getByText(/couldn't find that order/).waitFor();
  await page.getByLabel("Email").fill("buyer@test.dev");
  await page.getByRole("button", { name: "Find my order" }).click();
  await page.getByText(`Order #${order.number}: Shipped`).waitFor();
  assert((await page.getByRole("link", { name: "Track package" }).getAttribute("href")).includes("1Z999AA10123456784"), "tracking link");
  assert(!(await page.getByText("1 Test Lane").count()), "lookup never shows the address");
  ok("track page: wrong email refused; right email shows carrier + link, no address");

  // 7. refund through Stripe
  await page.goto(`${B}/dashboard/orders?id=${order.id}`);
  await page.getByRole("dialog").getByRole("button", { name: "Refund" }).click();
  await page.getByRole("dialog").getByText("Refunded").first().waitFor();
  s = await db();
  assert(s.orders.find((o) => o.id === order.id).status === "refunded", "refunded");
  assert(s.products.find((p) => p.id === product.id).stock === product.stock - 1, "refunded item back in stock (one order still sold)");
  ok("refund goes through Stripe and restocks");

  // 8. policies: filled from settings, linked in the footer, editable, white-label
  await page.goto(`${B}/dashboard/settings#policies`);
  await page.getByLabel("Time to ship (processing)").fill("2–4 business days");
  await page.getByLabel("Time to ship (processing)").blur();
  await page.getByLabel("Customer support email").fill("help@juniper.test");
  await page.getByLabel("Customer support email").blur();
  await waitSaved(page);
  await page.goto(`${B}/store/${slug}`);
  for (const name of ["Shipping policy", "Returns & refunds", "Privacy policy", "Terms of service", "Track your order"]) await page.getByRole("contentinfo").getByRole("link", { name }).waitFor();
  await page.getByRole("contentinfo").getByRole("link", { name: "Shipping policy" }).click();
  await page.getByRole("heading", { name: "Shipping policy" }).waitFor();
  await page.getByText(/within 2–4 business days of payment/).waitFor();
  await page.getByText(/help@juniper\.test/).first().waitFor();
  const html = (await page.content()).toLowerCase();
  assert(!html.includes("kovaz"), "policy pages are white-label");
  await shot("B03-policy");
  await page.goto(`${B}/dashboard/settings#policies`);
  const row = page.locator("li", { hasText: "Returns & refunds" });
  await row.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Returns & refunds").fill("## Returns\nAll sales are final unless the item arrives damaged.");
  await page.getByLabel("Returns & refunds").blur();
  await waitSaved(page);
  await page.goto(`${B}/store/${slug}/policies/returns`);
  await page.getByText("All sales are final unless the item arrives damaged.").waitFor();
  ok("policies: filled from settings, in the footer, editable, white-label");

  assert(errors.length === 0, "no page errors: " + errors.join(" | "));
  ok("no console errors");
  await browser.close();
})().catch((e) => {
  console.error("FAIL", e.message);
  process.exit(1);
});

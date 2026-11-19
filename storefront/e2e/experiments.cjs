// A/B testing walkthrough. Server must be running on :3100.  Usage: node e2e/experiments.cjs [screenshotDir]
const { chromium } = require("playwright");
const OUT = process.argv[2];
const B = "http://localhost:3100";
const ok = (s) => console.log("✓", s);
const assert = (c, m) => { if (!c) throw new Error(m); };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem("wharf:v1")).stores[0]);
  const shot = (n) => OUT && page.screenshot({ path: `${OUT}/${n}.png`, fullPage: false });

  // 1. assistant proposes and starts a headline test
  await page.goto(B + "/dashboard");
  const panel = page.getByRole("complementary", { name: "Store assistant" });
  await panel.getByLabel("Message the assistant").fill("Run an A/B test");
  await panel.getByRole("button", { name: "Send" }).click();
  await panel.getByRole("button", { name: "Start headline test" }).click();
  await panel.getByText("✓ Done").waitFor();
  let s = await db();
  assert(s.experiments.length === 1 && s.experiments[0].kind === "headline", "assistant should create a headline test");
  ok("assistant started a headline test");

  // 2. create a price test from the UI
  await page.goto(B + "/dashboard/experiments");
  await page.getByText("Homepage headline").first().waitFor();
  await page.getByRole("button", { name: "New experiment" }).click();
  const dlg = page.getByRole("dialog", { name: "New experiment" });
  await dlg.getByRole("radio", { name: /Product price/ }).click();
  await dlg.getByRole("button", { name: "Start experiment" }).click();
  await dlg.getByText("Enter a price above zero.").waitFor();
  ok("validation on empty price");
  await dlg.getByLabel(/B · new price/).fill("99");
  await dlg.getByRole("button", { name: "Start experiment" }).click();
  await page.getByText("Waiting for visitors").waitFor();
  await shot("S20-experiment-new");
  s = await db();
  const priceExp = s.experiments.find((e) => e.kind === "price");
  const product = s.products.find((p) => p.id === priceExp.productId);
  assert(priceExp.variants[1].value === 9900, "B price stored in cents");
  ok(`price test created: ${product.title} A=${priceExp.variants[0].value} B=9900`);

  // 3. preview B: storefront shows and charges the B price, without counting a visit
  await page.goto(`${B}/store/${s.slug}/p/${product.id}?ab=${priceExp.id}.b`);
  await page.getByText("Previewing variant B").waitFor();
  await page.getByText("$99.00").first().waitFor();
  await page.keyboard.press("Escape");
  s = await db();
  assert(s.experiments.find((e) => e.id === priceExp.id).variants.every((v) => v.views === 0), "previews must not count");
  ok("preview shows B price, not counted");
  await page.getByRole("button", { name: "Exit preview" }).click();
  await page.waitForLoadState("networkidle");

  // 4. a real (new) visitor is assigned, counted once, and their order converts
  // (the page load after "Exit preview" already counted this browser as a normal visitor)
  const before = (await db()).experiments.find((x) => x.id === priceExp.id).variants.map((v) => ({ ...v }));
  await page.evaluate((slug) => {
    localStorage.removeItem("wharf:visitor");
    localStorage.removeItem(`wharf:ab-seen:${slug}`);
    sessionStorage.clear();
  }, s.slug);
  await page.goto(`${B}/store/${s.slug}/p/${product.id}`);
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForTimeout(400);
  s = await db();
  let e = s.experiments.find((x) => x.id === priceExp.id);
  const delta = e.variants.map((v, i) => v.views - before[i].views);
  assert(delta[0] + delta[1] === 1, `visitor should be counted exactly once (got ${delta[0] + delta[1]})`);
  const mine = e.variants[delta[0] === 1 ? 0 : 1];
  const convBefore = before.find((v) => v.id === mine.id).conversions;
  ok(`new visitor assigned to ${mine.id.toUpperCase()} and counted once (reload didn't double count)`);
  const shownPrice = mine.value / 100;
  await page.getByText(`$${shownPrice.toFixed(2)}`).first().waitFor();
  await page.getByRole("dialog").waitFor({ timeout: 6000 }).then(() => page.keyboard.press("Escape")).catch(() => {});
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto(`${B}/store/${s.slug}/checkout`);
  for (const [l, v] of [["Email", "ab.tester@test.dev"], ["Full name", "AB Tester"], ["Address", "2 Split St"], ["City", "Denver"], ["Postal code", "80202"], ["Card number", "4242 4242 4242 4242"], ["Expiry (MM/YY)", "12/30"], ["Security code", "123"]])
    await page.getByLabel(l).fill(v);
  await page.getByRole("button", { name: /^Pay/ }).click();
  await page.waitForURL(/\/order\//);
  s = await db();
  e = s.experiments.find((x) => x.id === priceExp.id);
  const conv = e.variants.find((v) => v.id === mine.id);
  assert(conv.conversions === convBefore + 1 && conv.revenueCents > 0, "order should convert for the assigned variant");
  assert(s.orders[0].items[0].unitCents === mine.value, "order charged the variant price");
  ok(`order converted for ${mine.id.toUpperCase()} at ${s.orders[0].items[0].unitCents} cents`);

  // 5. simulate traffic until decided; auto-rollout applies the winner
  await page.goto(`${B}/dashboard/experiments?id=${priceExp.id}`);
  for (let i = 0; i < 12; i++) {
    s = await db();
    if (s.experiments.find((x) => x.id === priceExp.id).status === "completed") break;
    await page.getByRole("button", { name: "Simulate 250 visitors" }).click();
    await page.waitForTimeout(150);
  }
  await shot("S20-experiment-results");
  s = await db();
  e = s.experiments.find((x) => x.id === priceExp.id);
  const live = s.products.find((p) => p.id === product.id).priceCents;
  console.log(`  status=${e.status} winner=${e.winner ?? "-"} views A/B=${e.variants[0].views}/${e.variants[1].views} live price=${live}`);
  if (e.status === "completed") {
    assert(live === e.variants.find((v) => v.id === e.winner).value, "winner's price must be live");
    ok("auto-rollout applied the winning price");
  } else {
    await page.getByRole("button", { name: "Roll out B" }).click();
    page.once("dialog", (d) => d.accept());
  }

  // 6. manual rollout of the headline test
  const head = s.experiments.find((x) => x.kind === "headline");
  await page.goto(`${B}/dashboard/experiments?id=${head.id}`);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Roll out B" }).click();
  await page.getByText("B won and is now live").waitFor();
  s = await db();
  assert(s.heroHeadline === head.variants[1].value, "headline B should be live");
  ok("manual rollout made headline B live");

  await page.goto(`${B}/dashboard/experiments`);
  await shot("S20-experiments-list");
  console.log("console errors:", errors.length ? errors : "none");
  await browser.close();
  if (errors.length) process.exit(1);
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });

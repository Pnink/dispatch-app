// Core loop: empty start -> create -> dashboard -> storefront -> checkout -> order on the server.
const { chromium } = require("playwright");
const { B, ok, assert, storeBySlug, waitSaved, collectErrors } = require("./helpers.cjs");
const OUT = process.argv[2];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  collectErrors(page, errors);
  const shot = (n, full = true) => OUT && page.screenshot({ path: `${OUT}/${n}.png`, fullPage: full });

  for (const [n, u] of [["S01-home", "/"], ["S02-costs", "/costs"], ["S03-faq", "/faq"], ["S04-about", "/about"], ["S05-examples", "/examples"]]) {
    await page.goto(B + u);
    await page.waitForLoadState("networkidle");
    await shot(n);
  }
  ok("platform pages render");
  await page.goto(B + "/pricing");
  await page.waitForURL(/\/costs/);
  await page.getByRole("button", { name: "Free tier" }).first().click();
  await page.getByText("fixed +").waitFor();
  ok("costs page + /pricing redirect");

  // no sample store: first run asks for one
  await page.goto(B + "/dashboard");
  await page.getByRole("heading", { name: /Welcome to tillery/ }).waitFor();
  await shot("S00-first-run", false);
  ok("first run is empty (no sample store)");

  // create from the homepage prompt
  await page.goto(B + "/");
  await page.getByLabel("Describe your store idea").first().fill("A cosy coffee roaster with subscriptions, warm and earthy");
  await page.getByRole("button", { name: "Generate store" }).first().click();
  await page.waitForURL(/\/create/);
  await page.waitForTimeout(1500);
  await shot("S06-generating", false);
  await page.getByText("Your store is ready to review").waitFor({ timeout: 20000 });
  await shot("S07-review", false);
  await page.getByRole("button", { name: /Publish & open dashboard/ }).click();
  await page.waitForURL(/\/dashboard/);
  await waitSaved(page);
  await shot("S08-dashboard", false);
  const slug = await page.evaluate(async () => (await (await fetch("/api/admin/db")).json()).stores[0].slug);
  assert((await storeBySlug(page, slug)).published, "published store saved on server");
  ok(`store "${slug}" created and saved to the server`);

  // assistant: discount
  const panel = page.getByRole("complementary", { name: "Store assistant" });
  await panel.getByLabel("Message the assistant").fill("Create a 25% discount");
  await panel.getByRole("button", { name: "Send" }).click();
  await panel.getByRole("button", { name: "Create SAVE25" }).click();
  await panel.getByText("✓ Done").waitFor();
  await waitSaved(page);
  ok("assistant created SAVE25");

  // products: add with AI draft
  await page.goto(B + "/dashboard/products");
  await page.getByRole("button", { name: "Add product" }).first().click();
  await page.getByLabel("Product name").fill("Travel Mug");
  await page.getByRole("button", { name: /Draft with AI/ }).click();
  await page.waitForTimeout(1000);
  await page.getByRole("dialog").getByRole("button", { name: "Add product" }).click();
  await page.getByText("Travel Mug").first().waitFor();
  await waitSaved(page);
  await shot("S09-products", false);
  ok("product added");

  // apps: loyalty on
  await page.goto(B + "/dashboard/apps");
  await page.getByRole("switch", { name: /Loyalty points off/ }).click();
  await waitSaved(page);
  await shot("S11-apps", false);
  for (const [n, u] of [["S12-email", "/dashboard/email"], ["S13-design", "/dashboard/design"], ["S19-settings", "/dashboard/settings"]]) {
    await page.goto(B + u);
    await page.waitForTimeout(300);
    await shot(n, false);
  }
  const s = await storeBySlug(page, slug);
  assert(s.apps.loyalty, "loyalty saved");
  assert(s.discounts.some((d) => d.code === "SAVE25"), "discount saved");
  assert(s.products.some((p) => p.title === "Travel Mug"), "product saved");
  ok("loyalty, discount and product all saved");

  // storefront
  await page.goto(`${B}/store/${slug}`);
  await page.getByRole("dialog").waitFor({ timeout: 6000 });
  await shot("S14-popup", false);
  await page.keyboard.press("Escape");
  await shot("S14-storefront");
  await page.locator("#shop a").first().click();
  await page.waitForURL(/\/p\//);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await shot("S15-product");
  await page.goto(`${B}/store/${slug}/cart`);
  await shot("S16-cart", false);
  await page.getByRole("link", { name: "Check out" }).click();
  await page.waitForURL(/checkout/);
  await page.getByRole("button", { name: /^Pay/ }).click();
  await page.getByText("Enter a valid email.").waitFor();
  ok("checkout validation");
  for (const [l, v] of [["Email", "demo.shopper@test.dev"], ["Full name", "Demo Shopper"], ["Address", "1 Test Lane"], ["City", "Austin"], ["Postal code", "78701"]]) await page.getByLabel(l).fill(v);
  await page.getByLabel("Discount code").fill("nope");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.getByText("That code isn't valid.").waitFor();
  await page.getByLabel("Discount code").fill("save25");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.getByText("SAVE25 applied").waitFor();
  ok("discount code checked by the server");
  await page.getByLabel("Card number").fill("4000 0000 0000 0002");
  await page.getByLabel("Expiry (MM/YY)").fill("12/30");
  await page.getByLabel("Security code").fill("123");
  await page.getByRole("button", { name: /^Pay/ }).click();
  await page.getByText("Your card was declined").waitFor();
  await shot("S17-checkout-declined", false);
  ok("decline shown");
  await page.getByLabel("Card number").fill("4242 4242 4242 4242");
  await page.getByRole("button", { name: /^Pay/ }).click();
  await page.waitForURL(/\/order\//);
  await page.getByText(/You earned \d+ points/).waitFor();
  await shot("S18-confirmed", false);
  const after = await storeBySlug(page, slug);
  const order = after.orders[0];
  assert(order && order.customer.email === "demo.shopper@test.dev" && order.discountCents > 0, "order saved on server with discount");
  ok(`order #${order.number} saved on the server (${order.totalCents}¢, ${order.pointsEarned} points)`);

  await page.getByRole("link", { name: /See it in your dashboard/ }).click();
  await page.getByRole("dialog").getByText("Demo Shopper").waitFor();
  await shot("S10-orders", false);
  await page.getByRole("button", { name: "Mark as fulfilled" }).click();
  await page.getByRole("dialog").getByText("Fulfilled", { exact: true }).waitFor();
  await waitSaved(page);
  assert((await storeBySlug(page, slug)).orders[0].status === "fulfilled", "fulfilment saved");
  ok("fulfilled and saved");

  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(B + "/");
  if (OUT) await m.screenshot({ path: `${OUT}/S01-home-mobile.png`, fullPage: true });
  assert(!(await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), "no horizontal overflow on phones");

  console.log("console errors:", errors.length ? errors : "none");
  await browser.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error("FAIL", e.message);
  process.exit(1);
});

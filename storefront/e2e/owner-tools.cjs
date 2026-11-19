// Owner tools + saving + white-label: Today brief, ⌘K, shortcuts, sections, autosave to disk, email list, backup/restore.
// Usage: DATA_DIR=<dir the server uses> node e2e/owner-tools.cjs [screenshotDir]
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { B, ok, assert, storeBySlug, waitSaved, createStore, collectErrors } = require("./helpers.cjs");
const OUT = process.argv[2];
const DATA_DIR = process.env.DATA_DIR;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  collectErrors(page, errors);
  const shot = (n, full = false) => OUT && page.screenshot({ path: `${OUT}/${n}.png`, fullPage: full });

  await page.goto(B + "/");
  await page.getByRole("heading", { name: "Stop renting your store." }).waitFor();
  await shot("W01-home", true);
  ok("homepage");

  const slug = await createStore(page, "Dainty everyday gold jewellery, elegant and timeless", "jewelry");
  const db = () => storeBySlug(page, slug);

  // shoppers place two orders through the public API (as a browser would)
  const s0 = await db();
  for (const email of ["a@test.dev", "b@test.dev"]) {
    const r = await page.evaluate(
      async ([slug, pid, email]) =>
        (await fetch(`/api/public/stores/${slug}/order`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lines: [{ productId: pid, qty: 1 }], customer: { name: "T", email, address: "1 St", city: "X", zip: "1", country: "US" }, payment: { method: "card", number: "4242424242424242", expiry: "12/30", cvc: "123" }, visitor: "visitor123", exposed: [], forced: {} }),
        })).status,
      [slug, s0.products[0].id, email],
    );
    assert(r === 200, `order should succeed (got ${r})`);
  }

  // 1. Today brief picks the orders up; make a product sell out and fix it from Today
  await page.goto(B + "/dashboard");
  const today = page.locator("section", { has: page.getByRole("heading", { name: "Today" }) });
  await today.getByText(/Ship 2 orders/).waitFor();
  ok("new orders show up in the owner app");
  await page.goto(B + "/dashboard/products");
  await page.getByRole("button", { name: /^Edit / }).first().click();
  await page.getByLabel("Stock").fill("0");
  await page.getByRole("button", { name: "Save changes" }).click();
  await waitSaved(page);
  await page.goto(B + "/dashboard");
  await today.getByText(/sold out/).waitFor();
  await today.getByRole("button", { name: "Restock to 50" }).click();
  await today.getByText(/sold out/).waitFor({ state: "detached" });
  await waitSaved(page);
  assert((await db()).products.every((p) => p.stock >= 10), "restock should be saved");
  await shot("W02-today");
  ok("Today brief ranks and fixes (restock), saved");

  // 2. keyboard: ⌘K palette, g-shortcuts, ? help
  await page.keyboard.press("Control+k");
  const pal = page.getByRole("dialog", { name: "Command palette" });
  await pal.getByRole("combobox").fill("loyalty");
  await page.keyboard.press("Enter");
  await pal.waitFor({ state: "detached" });
  await waitSaved(page);
  assert((await db()).apps.loyalty === true, "palette should toggle loyalty");
  await page.locator("body").click({ position: { x: 5, y: 300 } });
  await page.keyboard.press("g");
  await page.keyboard.press("o");
  await page.waitForURL(/\/dashboard\/orders/);
  await page.keyboard.press("?");
  await page.getByRole("dialog", { name: "Keyboard shortcuts" }).waitFor();
  await shot("W05-shortcuts");
  await page.keyboard.press("Escape");
  ok("⌘K, G-then-letter and ? shortcuts");

  // 3. homepage sections + autosave straight to disk
  await page.goto(B + "/dashboard/design");
  await page.getByRole("button", { name: "Show Questions" }).click();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Move Questions up" }).click();
  await page.getByLabel("Announcement text").fill("Studio sale this weekend");
  await page.getByLabel("Title", { exact: true }).fill("Made slowly, on purpose");
  await waitSaved(page);
  await page.getByText(/Saved · /).waitFor();
  let s = await db();
  assert(s.sections[0].id === "faq" && s.sections[0].enabled, "FAQ should be first and visible");
  if (DATA_DIR) {
    const onDisk = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "db.json"), "utf8"));
    const st = onDisk.stores.find((x) => x.slug === slug);
    assert(st.announcement === "Studio sale this weekend" && st.story.title === "Made slowly, on purpose", "edits must be in db.json on disk");
    assert(fs.readdirSync(path.join(DATA_DIR, "backups")).length >= 1, "an automatic backup should exist");
    ok("typing saved to db.json on disk within a moment (and a backup exists)");
  }
  await shot("W03-design-sections");

  // 4. white-label storefront, as a stranger sees it
  const shopper = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const sp = await shopper.newPage();
  collectErrors(sp, errors);
  const html0 = await (await fetch(`${B}/store/${slug}`)).text();
  assert(!/kovaz/i.test(html0), "server HTML of a storefront must not mention the platform");
  const pub = await (await fetch(`${B}/api/public/stores/${slug}`)).json();
  assert(!("orders" in pub) && !("subscribers" in pub) && !("loyalty" in pub) && !("flows" in pub) && pub.discounts.length === 0, "public data must not include orders, customers, email list or discount codes");
  for (const p of ["", "/cart"]) {
    await sp.goto(`${B}/store/${slug}${p}`);
    await sp.waitForTimeout(600);
    await sp.keyboard.press("Escape");
    const text = await sp.locator("body").innerText();
    assert(!/kovaz|powered by|owner view/i.test(text), `storefront${p} shows platform text`);
  }
  await sp.goto(`${B}/store/${slug}`);
  await sp.getByText("Studio sale this weekend").waitFor();
  assert((await sp.locator("main > div").first().innerText()).startsWith("Questions"), "FAQ section should render first");
  assert((await sp.title()) === s.name, `tab title should be the store name, got "${await sp.title()}"`);
  const icon = await sp.locator("link[rel='icon']").getAttribute("href");
  assert(icon && icon.startsWith("data:image/svg+xml"), "store favicon should be set");
  const keys = await sp.evaluate(() => Object.keys(localStorage).join(" "));
  assert(!/kovaz/i.test(keys), "shopper-visible storage keys must not name the platform");
  if (OUT) await sp.screenshot({ path: `${OUT}/W04-storefront-shopper.png`, fullPage: true });
  ok("storefront is white-label (HTML, page text, title, favicon, storage keys) and public data is private-safe");

  // 5. newsletter sign-up from a shopper lands in the owner's email list
  await sp.waitForTimeout(300);
  await sp.keyboard.press("Escape");
  await sp.getByLabel("Email address").last().fill("fan@test.dev");
  await sp.getByRole("button", { name: "Subscribe" }).click();
  await sp.getByText("You're on the list.").waitFor();
  assert((await db()).subscribers.includes("fan@test.dev"), "subscriber saved");
  await shopper.close();
  ok("newsletter sign-up saved to the email list");

  // 6. backup -> change -> restore
  await page.goto(B + "/dashboard/settings");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Full backup/ }).click()]);
  const file = await dl.path();
  const backup = JSON.parse(fs.readFileSync(file, "utf8"));
  assert(backup.format === "kovaz-backup" && backup.stores.length >= 1, "backup format");
  const [csv] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Orders CSV" }).click()]);
  assert(fs.readFileSync(await csv.path(), "utf8").startsWith("number,date,status"), "orders csv header");
  await page.getByLabel("Store name").fill("Wiped");
  await waitSaved(page);
  assert((await db()).name === "Wiped", "rename saved");
  page.once("dialog", (d) => d.accept());
  await page.locator("input[type=file]").setInputFiles(file);
  await page.getByText("Restored.").waitFor();
  await waitSaved(page);
  assert((await db()).name === s.name, "restore brings the name back");
  ok("backup, CSV export and restore round-trip");

  console.log("console errors:", errors.length ? errors : "none");
  await browser.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error("FAIL", e.message);
  process.exit(1);
});

// Rebrand + owner tools: white-label storefront, Today brief, ⌘K, homepage sections, email list, backup/restore.
// Server must be running on :3100.  Usage: node e2e/owner-tools.cjs [screenshotDir]
const { chromium } = require("playwright");
const fs = require("fs");
const OUT = process.argv[2];
const B = "http://localhost:3100";
const ok = (s) => console.log("✓", s);
const assert = (c, m) => { if (!c) throw new Error(m); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem("wharf:v1")).stores[0]);
  const shot = (n, full = false) => OUT && page.screenshot({ path: `${OUT}/${n}.png`, fullPage: full });

  // platform site carries the new brand
  await page.goto(B + "/");
  await page.getByRole("heading", { name: "Stop renting your store." }).waitFor();
  await shot("W01-home", true);
  ok("new homepage");

  // 1. Today brief: seeded store has 2 unfulfilled orders and stock; act on an item
  await page.goto(B + "/dashboard");
  const today = page.locator("section", { has: page.getByRole("heading", { name: "Today" }) });
  await today.getByText(/Ship 2 orders/).waitFor();
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("wharf:v1"));
    d.stores[0].products[0].stock = 0;
    localStorage.setItem("wharf:v1", JSON.stringify(d));
  });
  await page.reload();
  await today.getByText(/sold out/).waitFor();
  await today.getByRole("button", { name: "Restock to 50" }).click();
  await today.getByText(/sold out/).waitFor({ state: "detached" });
  assert((await db()).products[0].stock === 50, "restock should apply");
  await shot("W02-today");
  ok("Today brief ranks and fixes (restock)");

  // 2. command palette
  await page.keyboard.press("Control+k");
  const pal = page.getByRole("dialog", { name: "Command palette" });
  await pal.getByRole("combobox").fill("loyalty");
  await page.keyboard.press("Enter");
  await pal.waitFor({ state: "detached" });
  assert((await db()).apps.loyalty === true, "palette should toggle loyalty");
  await page.keyboard.press("Control+k");
  await pal.getByRole("combobox").fill("experiments");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/dashboard\/experiments/);
  ok("⌘K toggles a switch and navigates");

  // 3. homepage sections: show FAQ, move it to the top, edit announcement + story
  await page.goto(B + "/dashboard/design");
  await page.getByRole("button", { name: "Show Questions" }).click();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Move Questions up" }).click();
  await page.getByLabel("Announcement text").fill("Studio sale this weekend");
  await page.getByLabel("Title", { exact: true }).fill("Made slowly, on purpose");
  let s = await db();
  assert(s.sections[0].id === "faq" && s.sections[0].enabled, "FAQ should be first and visible");
  await shot("W03-design-sections");
  ok("sections reordered and edited");

  // 4. white-label storefront
  await page.goto(`${B}/store/${s.slug}`);
  await page.getByText("Studio sale this weekend").waitFor();
  await page.getByRole("heading", { name: "Made slowly, on purpose" }).waitFor();
  const firstSection = await page.locator("main > div").first().innerText();
  assert(firstSection.startsWith("Questions"), "FAQ section should render first");
  await page.waitForTimeout(300);
  assert((await page.title()) === s.name, `tab title should be the store name, got "${await page.title()}"`);
  const icon = await page.locator("link[rel='icon']").getAttribute("href");
  assert(icon && icon.startsWith("data:image/svg+xml"), "store favicon should be set");
  // a shopper (no owner flag) sees no platform trace at all
  const shopper = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const sp = await shopper.newPage();
  await sp.goto(B + "/dashboard"); // seed the same sample store in the shopper's storage…
  await sp.getByText(/Good (morning|afternoon|evening)/).waitFor();
  await sp.evaluate(() => localStorage.removeItem("wharf:owner")); // …then drop the owner flag
  const slug = await sp.evaluate(() => JSON.parse(localStorage.getItem("wharf:v1")).stores[0].slug);
  const html0 = await (await fetch(`${B}/store/${slug}`)).text();
  assert(!/wharf/i.test(html0.replace(/wharf:[a-z-]+/gi, "")), "server HTML of a storefront must not mention the platform");
  for (const path of ["", "/cart"]) {
    await sp.goto(`${B}/store/${slug}${path}`);
    await sp.waitForTimeout(500);
    await sp.keyboard.press("Escape");
    const text = await sp.locator("body").innerText();
    assert(!/wharf|powered by|owner view/i.test(text), `storefront${path} shows platform text`);
  }
  await sp.screenshot({ path: OUT ? `${OUT}/W04-storefront-shopper.png` : "/dev/null", fullPage: true });
  await shopper.close();
  ok("storefront is white-label: title, favicon, no platform text (server HTML and page)");

  // 5. newsletter sign-up lands in the email list
  await page.goto(`${B}/store/${s.slug}`);
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await page.getByLabel("Email address").last().fill("fan@test.dev");
  await page.getByRole("button", { name: "Subscribe" }).click();
  await page.getByText("You're on the list.").waitFor();
  assert((await db()).subscribers.includes("fan@test.dev"), "subscriber saved");
  ok("newsletter sign-up saved to email list");

  // 6. backup → wipe → restore
  await page.goto(B + "/dashboard/settings");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Full backup/ }).click()]);
  const file = await dl.path();
  const backup = JSON.parse(fs.readFileSync(file, "utf8"));
  assert(backup.format === "wharf-backup" && backup.stores.length >= 1, "backup format");
  const [csv] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Orders CSV" }).click()]);
  assert(fs.readFileSync(await csv.path(), "utf8").startsWith("number,date,status"), "orders csv header");
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("wharf:v1"));
    d.stores[0].name = "Wiped";
    localStorage.setItem("wharf:v1", JSON.stringify(d));
  });
  await page.reload();
  page.once("dialog", (d) => d.accept());
  await page.locator("input[type=file]").setInputFiles(file);
  await page.getByText("Restored.").waitFor();
  assert((await db()).name === backup.stores[0].name, "restore brings the name back");
  ok("backup, CSV export and restore round-trip");

  console.log("console errors:", errors.length ? errors : "none");
  await browser.close();
  if (errors.length) process.exit(1);
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });

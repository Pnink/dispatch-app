// Build a whole store from product photos: free builder (BASE_URL) and an AI model that sees the photos (BASE_URL_AI, fake provider).
const { chromium } = require("playwright");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { ok, assert, collectErrors, waitSaved, makePhoto } = require("./helpers.cjs");
const B = process.env.BASE_URL || "http://localhost:3100";
const BAI = process.env.BASE_URL_AI || "http://localhost:3102";
const OUT = process.argv[2];

(async () => {
  const browser = await chromium.launch();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "photos-"));
  const red = await makePhoto(browser, "#b5452f", path.join(tmp, "IMG_20261119_lavender.png"));
  const blue = await makePhoto(browser, "#2f4f8f", path.join(tmp, "cedar-candle.png"));
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  collectErrors(page, errors);
  const db = async (base) => page.evaluate(async () => (await fetch("/api/admin/db")).json());

  // ---- 1. free builder: photos + notes -> live store, nothing else to do
  await page.goto(B + "/create");
  await page.getByLabel("Product photos").setInputFiles([red, blue]);
  await page.getByAltText("Product photo 2").waitFor();
  await page.getByLabel(/Tell us about it/).fill("Juniper Candle Co — hand-poured soy candles\nLavender candle 8oz - $24\nCedar candle - $32");
  if (OUT) await page.screenshot({ path: `${OUT}/P01-photos-in.png` });
  await page.getByRole("button", { name: "Build my store" }).click();
  await page.getByText("Uploading your photos").waitFor();
  await page.waitForURL(/\/dashboard\?welcome=1/, { timeout: 25000 });
  await page.getByText("Juniper Candle Co is live.").waitFor();
  await waitSaved(page);
  let s = (await db()).stores.find((x) => x.name === "Juniper Candle Co");
  assert(s && s.published, "store named from the notes and published automatically");
  assert(s.products.length === 2, `one product per photo (got ${s.products.length})`);
  assert(s.products[0].title === "Lavender candle 8oz" && s.products[0].priceCents === 2400, "name + price from notes line 1");
  assert(s.products[1].title === "Cedar candle" && s.products[1].priceCents === 3200, "name + price from notes line 2");
  assert(s.products.every((p) => /^[0-9a-f-]{36}\.(webp|jpg)$/.test(p.image)), "each product has its uploaded photo");
  assert(s.reviews.length === 0, "no invented reviews");
  assert(/^#[0-9a-f]{6}$/.test(s.palette.accent) && s.palette.accent !== "#7c4a2d", `accent taken from the photo (${s.palette.accent})`);
  ok(`free builder: 2 photos + notes -> "${s.name}" live, products/prices from notes, real photos, colour from photo (${s.palette.accent})`);

  // storefront shows the real photos to a stranger
  const shopper = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await shopper.goto(`${B}/store/${s.slug}`);
  await shopper.waitForTimeout(500);
  await shopper.keyboard.press("Escape");
  const srcs = await shopper.locator("#shop img").evaluateAll((els) => els.map((e) => [e.getAttribute("src"), e.naturalWidth]));
  assert(srcs.length === 2 && srcs.every(([src, w]) => src.startsWith("/api/public/media/") && w > 0), `storefront shows the uploaded photos (${JSON.stringify(srcs)})`);
  const head = await fetch(B + srcs[0][0]);
  assert(head.ok && /^image\/(webp|jpeg)$/.test(head.headers.get("content-type")) && head.headers.get("x-content-type-options") === "nosniff", "photo served as an image");
  if (OUT) await shopper.screenshot({ path: `${OUT}/P02-photo-storefront.png`, fullPage: true });
  await shopper.close();
  ok("storefront displays the real product photos");

  // ---- 2. photo security
  const svg = await page.evaluate(async () => (await fetch("/api/admin/media", { method: "POST", headers: { "content-type": "image/svg+xml" }, body: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>' })).status);
  assert(svg === 415, `SVG upload must be refused (got ${svg})`);
  const fake = await page.evaluate(async () => (await fetch("/api/admin/media", { method: "POST", headers: { "content-type": "image/png" }, body: "not really a png at all" })).status);
  assert(fake === 415, "non-image bytes refused even when labelled image/png");
  for (const bad of ["..%2Fdb.json", "..%2F..%2Fpackage.json", "x.png"]) assert((await fetch(`${B}/api/public/media/${bad}`)).status === 404, `media path trick ${bad} must 404`);
  ok("photo uploads: SVG and fake images refused; path tricks can't read other files");

  // ---- 3. AI model sees the photos (fake provider)
  await page.goto(BAI + "/costs");
  await page.evaluate(async () => fetch("/api/admin/ai", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ aiModel: "claude-fable-5-2" }) }));
  await page.goto(BAI + "/create?review=1");
  await page.getByText(/Built with Claude Fable 5\.2/).waitFor();
  await page.getByLabel("Product photos").setInputFiles([red, blue]);
  await page.getByAltText("Product photo 2").waitFor();
  await page.getByRole("button", { name: "Build my store" }).click();
  await page.getByText("Your store is ready to review").waitFor({ timeout: 25000 });
  await page.getByText("Written by Claude Fable 5.2").waitFor();
  assert((await page.getByLabel("Store name").inputValue()) === "Fake Photo Studio", "AI-written name");
  await page.getByText("Photo product 2").first().waitFor();
  const previewImgs = await page.locator('section[aria-label="Storefront preview"] #shop img').count();
  assert(previewImgs === 2, `preview shows both photos (got ${previewImgs})`);
  if (OUT) await page.screenshot({ path: `${OUT}/P03-ai-photo-review.png` });
  await page.getByRole("button", { name: /Publish & open dashboard/ }).click();
  await page.waitForURL(/\/dashboard/);
  await waitSaved(page);
  s = (await db()).stores.find((x) => x.name === "Fake Photo Studio");
  assert(s.products.length === 2 && s.products.every((p, i) => p.image && p.title === `Photo product ${i + 1}`), "AI product per photo with photo attached");
  assert(s.faqs.length >= 1 && s.sections.find((x) => x.id === "faq").enabled && s.announcement.includes("Ships"), "AI also wrote FAQs + announcement");
  ok("AI model (Claude Fable 5.2) builds the store from the photos: one product per photo, copy, FAQs, announcement");

  console.log("console errors:", errors.length ? errors : "none");
  await browser.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error("FAIL", e.message);
  process.exit(1);
});

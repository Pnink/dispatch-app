// Shared helpers for the e2e suites. The server must be running (see e2e/run.sh).
const B = process.env.BASE_URL || "http://localhost:3100";

const ok = (s) => console.log("✓", s);
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

/** Read the whole database through the owner API (localhost needs no password). */
async function adminDb(page) {
  return page.evaluate(async () => (await fetch("/api/admin/db", { cache: "no-store" })).json());
}

async function storeBySlug(page, slug) {
  return (await adminDb(page)).stores.find((s) => s.slug === slug);
}

/** Wait until the owner app has saved everything to the server. */
async function waitSaved(page) {
  await page.waitForFunction(() => document.querySelector("[data-save-state]")?.getAttribute("data-save-state") === "saved", null, { timeout: 15000 });
}

/** Create and publish a store through the real UI. Returns its slug. */
async function createStore(page, prompt, category) {
  const q = new URLSearchParams({ prompt });
  if (category) q.set("category", category);
  const before = new Set((await adminDbFrom(page)).stores.map((s) => s.slug));
  await page.goto(`${B}/create?${q}`);
  await page.getByText("Your store is ready to review").waitFor({ timeout: 20000 });
  await page.getByRole("button", { name: /Publish & open dashboard/ }).click();
  await page.waitForURL(/\/dashboard/);
  await waitSaved(page);
  const after = (await adminDb(page)).stores;
  const created = after.find((s) => !before.has(s.slug));
  assert(created && created.published, "store should be created and published on the server");
  return created.slug;
}

async function adminDbFrom(page) {
  if (!page.url().startsWith(B)) await page.goto(`${B}/costs`);
  return adminDb(page);
}

function collectErrors(page, errors) {
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
}

async function checkout(page, slug, { email = "shopper@test.dev", card = "4242 4242 4242 4242", code } = {}) {
  await page.goto(`${B}/store/${slug}/checkout`);
  for (const [l, v] of [["Email", email], ["Full name", "Test Shopper"], ["Address", "1 Test Lane"], ["City", "Austin"], ["Postal code", "78701"]]) await page.getByLabel(l).fill(v);
  if (code) {
    await page.getByLabel("Discount code").fill(code);
    await page.getByRole("button", { name: "Apply" }).click();
    await page.getByText(/applied —/).waitFor();
  }
  await page.getByLabel("Card number").fill(card);
  await page.getByLabel("Expiry (MM/YY)").fill("12/30");
  await page.getByLabel("Security code").fill("123");
  await page.getByRole("button", { name: /^Pay/ }).click();
}

module.exports = { B, ok, assert, adminDb, storeBySlug, waitSaved, createStore, collectErrors, checkout };

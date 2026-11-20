// AI team: specialists, the checker + editor loop, applying results, memory, practice tests.
// Runs against the AI_FAKE server (BASE_URL_AI) so nothing is spent.
const { chromium } = require("playwright");
const { ok, assert, collectErrors, waitSaved } = require("./helpers.cjs");
const B = process.env.BASE_URL_AI || "http://localhost:3102";
const OUT = process.argv[2];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  collectErrors(page, errors);
  page.on("dialog", (d) => d.accept());
  const shot = (n) => OUT && page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
  const db = () => page.evaluate(async () => (await fetch("/api/admin/db")).json());

  // a store to work on (the ai suite may already have made one on this server; reuse it if so)
  await page.goto(B + "/costs");
  if (!(await db()).stores.length) {
    const q = new URLSearchParams({ prompt: "Hand-poured soy candles in amber jars", category: "homeware", review: "1" });
    await page.goto(`${B}/create?${q}`);
    await page.getByText("Your store is ready to review").waitFor({ timeout: 20000 });
    await page.getByRole("button", { name: /Publish & open dashboard/ }).click();
    await page.waitForURL(/\/dashboard/);
    await waitSaved(page);
  }

  // 1. free rules: the page works and says it's basic
  await page.evaluate(() => fetch("/api/admin/ai", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ aiModel: "builtin" }) }));
  await page.goto(B + "/dashboard/ai");
  await page.getByRole("heading", { name: "AI team" }).waitFor();
  await page.getByText(/You're on the free rules/).waitFor();
  await page.getByRole("tab", { name: /SEO/ }).click();
  await page.getByRole("button", { name: /Ask the specialist/ }).click();
  await page.locator("[data-specialist-result]").waitFor();
  await page.getByText("by Free rules").waitFor();
  ok("free rules: specialists answer without any AI model");

  // 2. with a model: product page writer — editor catches a made-up claim and it's revised
  await page.evaluate(() => fetch("/api/admin/ai", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ aiModel: "claude-opus-5-5" }) }));
  await page.reload();
  await page.getByRole("main").getByRole("link", { name: "Claude Opus 5.5" }).waitFor();
  assert(!(await page.getByText(/You're on the free rules/).count()), "no free-rules warning with a real model");
  await page.getByRole("tab", { name: /Product page writer/ }).click();
  await page.getByRole("button", { name: /Ask the specialist/ }).click();
  const result = page.locator("[data-specialist-result]");
  await result.waitFor();
  await result.getByText(/Editor found \d+ problems? — fixed/).waitFor();
  const text = await result.locator(".bg-surface").first().innerText();
  assert(!/best-selling/i.test(text), "revised copy no longer has the unsupported 'best-selling' claim");
  ok("product page: editor review found a problem and the revision fixed it");
  await shot("I01-ai-team");

  const pid = (await db()).stores[0].products.find((p) => p.status === "active").id;
  await result.getByRole("button", { name: "Use this on the product page" }).click();
  await result.getByText("Applied").waitFor();
  await waitSaved(page);
  const prod = (await db()).stores[0].products.find((p) => p.id === pid);
  assert(prod.seoTitle || prod.metaDescription, "product got SEO fields from the specialist");
  ok("applying product copy saves it to the product");

  // 3. every other specialist answers and passes the rule check
  for (const [tab, setup] of [
    ["Pricing advisor", null],
    ["Email writer", null],
    ["A/B test planner", null],
    ["Search \\(SEO\\) writer", null],
    ["Customer service", async () => page.getByLabel("Customer's message").fill("Can I get a refund on my order?")],
  ]) {
    await page.getByRole("tab", { name: new RegExp(tab) }).click();
    if (setup) await setup();
    await page.getByRole("button", { name: /Ask the specialist/ }).click();
    await page.locator("[data-specialist-result]").waitFor();
    assert(!(await page.locator("[data-specialist-result]").getByText(/^Blocked:/).count()), `${tab}: nothing blocked`);
    if (tab === "Customer service") await page.getByText(/Needs your decision/).waitFor();
    if (tab.startsWith("Search")) {
      await page.getByRole("button", { name: /Apply to all \d+ products/ }).click();
      await page.getByText("Applied").waitFor();
    }
  }
  ok("pricing, email, tests, SEO and support specialists all answer; refunds are flagged for the owner");

  // 4. memory: owner facts are saved and reach the specialists
  await page.getByLabel("Teach it something about your business").fill("We never discount more than 15%.");
  await page.getByRole("button", { name: "Remember" }).click();
  await page.getByText("We never discount more than 15%.").waitFor();
  await waitSaved(page);
  assert((await db()).stores[0].lessons.some((l) => l.source === "owner" && /15%/.test(l.text)), "lesson saved");
  const pub = await page.evaluate(async (slug) => (await fetch(`/api/public/stores/${slug}`)).text(), (await db()).stores[0].slug).catch(() => "");
  assert(!pub.includes("We never discount more than 15%"), "memory is never shown to shoppers");
  ok("memory: lessons are saved and private");

  // 5. start a test from the planner, finish it, and its result lands in memory
  await page.getByRole("tab", { name: /A\/B test planner/ }).click();
  await page.getByRole("button", { name: /Ask the specialist/ }).click();
  await page.locator("[data-specialist-result]").waitFor();
  await page.getByRole("button", { name: "Start this test" }).first().click();
  await page.getByText("Applied").first().waitFor();
  await waitSaved(page);
  const exp = (await db()).stores[0].experiments.find((e) => e.status === "running");
  assert(exp, "a test is running");
  await page.goto(`${B}/dashboard/experiments?id=${exp.id}`);
  await page.getByRole("button", { name: "Roll out B" }).click();
  await page.getByText("B won and is now live").waitFor();
  await waitSaved(page);
  assert((await db()).stores[0].lessons.some((l) => l.source === "result"), "finished test wrote a lesson");
  await page.goto(B + "/dashboard/ai");
  await page.getByText("Test result", { exact: true }).first().waitFor();
  ok("planner → test → rollout → result saved in memory");

  // 6. practice test runs, is scored and saved in the history
  await page.goto(B + "/dashboard/ai");
  await page.getByRole("button", { name: /Run practice test with Claude Opus 5\.5/ }).click();
  await page.locator("[data-eval-score]").first().waitFor({ timeout: 30000 });
  const scoreText = await page.locator("[data-eval-score]").first().innerText();
  const n = Number(scoreText.split("/")[0]);
  assert(n >= 0 && n <= 100, "score between 0 and 100");
  const hist = (await page.evaluate(async () => (await fetch("/api/admin/ai")).json())).evals;
  assert(hist.length >= 1 && hist[0].cases.length === 7 && hist[0].model === "claude-opus-5-5", "run saved with all 7 cases");
  ok(`practice test scored ${scoreText} and saved to history`);
  await shot("I02-ai-quality");

  // 7. nav + shortcut
  await page.goto(B + "/dashboard");
  await page.getByRole("heading").first().waitFor();
  await page.locator("body").click({ position: { x: 5, y: 300 } });
  await page.keyboard.press("g");
  await page.keyboard.press("i");
  await page.waitForURL(/\/dashboard\/ai/);
  ok("G then I opens the AI team");

  await page.evaluate(() => fetch("/api/admin/ai", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ aiModel: "builtin" }) }));
  assert(errors.length === 0, "no page errors: " + errors.join(" | "));
  ok("no console errors");
  await browser.close();
})().catch((e) => {
  console.error("FAIL", e.message);
  process.exit(1);
});

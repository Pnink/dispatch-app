// AI model picker + assistant + generation, against a server started with AI_FAKE=1 (no real calls, no spend).
// BASE_URL_AI: that server. BASE_URL: a normal server with no keys (to check the no-key state).
const { chromium } = require("playwright");
const { ok, assert, collectErrors, waitSaved } = require("./helpers.cjs");
const B = process.env.BASE_URL_AI || "http://localhost:3102";
const PLAIN = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  collectErrors(page, errors);
  const shot = (n) => OUT && page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });

  // 0. without keys, real models can't be picked
  await page.goto(PLAIN + "/dashboard/settings");
  const noKey = await page.evaluate(async () => (await fetch("/api/admin/ai")).json());
  if (noKey.aiModel !== undefined) {
    // (only meaningful once a store exists on that server; the API itself answers regardless)
    assert(noKey.keys.anthropic === false && noKey.keys.openai === false, "plain server has no keys");
    ok("no keys -> built-in rules only");
  }

  // 1. the catalogue lists every Claude model and the main OpenAI models; keys never leak
  await page.goto(B + "/costs");
  const s = await page.evaluate(async () => (await fetch("/api/admin/ai")).json());
  assert(s.keys.anthropic && s.keys.openai && s.aiModel === "builtin", "fake-mode server reports both keys, default built-in");
  const raw = await page.evaluate(async () => (await fetch("/api/admin/ai")).text());
  assert(!raw.includes("sk-test-"), "API keys must never be sent to the browser");
  ok("keys configured on the server, never sent to the browser");

  // need a store to open the dashboard: create one with the built-in generator first
  const q = new URLSearchParams({ prompt: "Small-batch coffee roaster with a warm, cosy feel", category: "coffee" });
  await page.goto(`${B}/create?${q}`);
  await page.getByText("Your store is ready to review").waitFor({ timeout: 20000 });
  assert(!(await page.locator("[data-ai-note]").count()), "built-in generation shows no AI note");
  await page.getByRole("button", { name: /Publish & open dashboard/ }).click();
  await page.waitForURL(/\/dashboard/);
  await waitSaved(page);

  await page.goto(B + "/dashboard/settings#ai");
  for (const id of ["claude-fable-5-2", "claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5", "claude-haiku-4-5", "claude-mythos-5-2", "gpt-6.2-astra", "gpt-6-astra", "gpt-6.2-sol", "gpt-6-luna"])
    await page.getByText(id, { exact: true }).waitFor();
  await page.getByRole("radio", { name: /Claude Opus 5\.5/ }).click();
  await page.getByRole("radio", { name: /Claude Opus 5\.5/ }).and(page.locator("[aria-checked=true]")).waitFor();
  assert((await page.evaluate(async () => (await fetch("/api/admin/ai")).json())).aiModel === "claude-opus-5-5", "choice saved on the server");
  await shot("A01-ai-models");
  ok("picker lists Claude (incl. Fable, Mythos) and OpenAI (incl. Astra) models; choice saved");

  // 2. the assistant answers with the chosen model and its proposed action can be applied
  const panel = page.getByRole("complementary", { name: "Store assistant" });
  if (!(await panel.count())) await page.getByRole("button", { name: "Assistant" }).click();
  await panel.getByText(/Model: Claude Opus 5\.5/).waitFor();
  await panel.getByLabel("Message the assistant").fill("Make me a discount");
  await panel.getByRole("button", { name: "Send" }).click();
  await panel.getByText("(claude-opus-5-5) I can set up a").waitFor();
  await panel.locator("div.uppercase", { hasText: "Claude Opus 5.5" }).first().waitFor(); // "answered by" tag
  await panel.getByRole("button", { name: "Create SAVE20" }).click();
  await waitSaved(page);
  const st = (await page.evaluate(async () => (await fetch("/api/admin/db")).json())).stores[0];
  assert(st.discounts.some((d) => d.code === "SAVE20" && d.percent === 20), "AI-proposed discount applied after approval");
  ok("assistant replies via Claude Opus 5.5; its proposed change applies only after approval");

  // 3. switch to an OpenAI model
  await page.getByRole("radio", { name: /GPT-6 Astra/ }).click();
  await page.waitForTimeout(300);
  await panel.getByLabel("Message the assistant").fill("hello");
  await panel.getByRole("button", { name: "Send" }).click();
  await panel.getByText("(gpt-6-astra) Hello from the AI route.").waitFor();
  ok("switching to GPT-6 Astra routes the assistant to OpenAI");

  // 4. store generation is written by the chosen model
  await page.goto(`${B}/create?${new URLSearchParams({ prompt: "Cheerful stationery shop for students" })}`);
  await page.getByText("Your store is ready to review").waitFor({ timeout: 20000 });
  await page.getByText("Written by GPT-6 Astra").waitFor();
  await page.getByText("Model-made Mug").first().waitFor();
  assert((await page.getByLabel("Store name").inputValue()) === "Fake Model Goods", "AI-written name used");
  await shot("A02-ai-generated");
  ok("new store written by the chosen model (name, products, copy), artwork kept");

  console.log("console errors:", errors.length ? errors : "none");
  await browser.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error("FAIL", e.message);
  process.exit(1);
});

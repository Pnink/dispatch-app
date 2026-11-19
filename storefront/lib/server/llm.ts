/**
 * Server-side calls to Claude (Anthropic SDK) and ChatGPT models (OpenAI SDK).
 * API keys come from the environment (.env.local) and never reach a browser.
 *   ANTHROPIC_API_KEY  - Claude models
 *   OPENAI_API_KEY     - OpenAI models
 * Every call asks for structured JSON output matching a schema, so replies are machine-checkable.
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { findModel, providerOf } from "../ai-models";

export const keys = () => ({ anthropic: !!process.env.ANTHROPIC_API_KEY, openai: !!process.env.OPENAI_API_KEY });

export class AiError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

type Msg = { role: "user" | "assistant"; content: string };

export async function callModel<T>(model: string, system: string, messages: Msg[], schema: object, opts: { effort?: "low" | "medium" | "high" } = {}): Promise<T> {
  // Test-only switch: deterministic fake replies so the plumbing can be tested without keys or spend.
  if (process.env.AI_FAKE === "1") return fakeReply(model, messages, schema) as T;

  const provider = providerOf(model);
  if (provider === "anthropic") return callClaude<T>(model, system, messages, schema, opts.effort ?? "low");
  if (provider === "openai") return callOpenAI<T>(model, system, messages, schema);
  throw new AiError("Pick a model first.", 400);
}

async function callClaude<T>(model: string, system: string, messages: Msg[], schema: object, effort: "low" | "medium" | "high"): Promise<T> {
  if (!process.env.ANTHROPIC_API_KEY) throw new AiError("Add ANTHROPIC_API_KEY to .env.local to use Claude models.", 400);
  const info = findModel(model);
  const client = new Anthropic();
  const params = {
    model,
    max_tokens: 16000,
    system,
    messages,
    // structured output, plus effort where the model supports it (thinking is left at each model's default)
    output_config: { format: { type: "json_schema" as const, schema: schema as Record<string, unknown> }, ...(info?.effort ? { effort } : {}) },
  };
  try {
    // Newer models: if a safety classifier declines, the API retries on a fallback model automatically.
    const response = info?.fallbacks
      ? await client.beta.messages.create({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } as Parameters<typeof client.beta.messages.create>[0] & { stream?: false })
      : await client.messages.create(params as Parameters<typeof client.messages.create>[0] & { stream?: false });
    if (response.stop_reason === "refusal") throw new AiError("The model declined that request. Try rephrasing it.", 422);
    if (response.stop_reason === "max_tokens") throw new AiError("The reply was cut off. Try a shorter request.", 502);
    const text = response.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return JSON.parse(text) as T;
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AiError("Your Anthropic API key was rejected. Check ANTHROPIC_API_KEY.", 401);
    if (e instanceof Anthropic.PermissionDeniedError) throw new AiError("Your Anthropic account can't use this model.", 403);
    if (e instanceof Anthropic.NotFoundError) throw new AiError(`Model ${model} isn't available on your Anthropic account.`, 404);
    if (e instanceof Anthropic.RateLimitError) throw new AiError("Claude is rate-limiting this key. Wait a moment and try again.", 429);
    if (e instanceof Anthropic.BadRequestError) throw new AiError(`Claude rejected the request: ${e.message}`, 400);
    if (e instanceof Anthropic.APIError) throw new AiError(`Claude error ${e.status ?? ""}: ${e.message}`, 502);
    if (e instanceof SyntaxError) throw new AiError("The model's reply wasn't valid JSON.", 502);
    throw new AiError("Couldn't reach Anthropic. Check your internet connection.", 502);
  }
}

async function callOpenAI<T>(model: string, system: string, messages: Msg[], schema: object): Promise<T> {
  if (!process.env.OPENAI_API_KEY) throw new AiError("Add OPENAI_API_KEY to .env.local to use OpenAI models.", 400);
  const client = new OpenAI();
  try {
    const r = await client.chat.completions.create({
      model,
      messages: [{ role: "system", content: system }, ...messages],
      response_format: { type: "json_schema", json_schema: { name: "reply", strict: true, schema: schema as Record<string, unknown> } },
    });
    const choice = r.choices[0];
    if (choice?.message?.refusal) throw new AiError("The model declined that request. Try rephrasing it.", 422);
    return JSON.parse(choice?.message?.content ?? "") as T;
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof OpenAI.AuthenticationError) throw new AiError("Your OpenAI API key was rejected. Check OPENAI_API_KEY.", 401);
    if (e instanceof OpenAI.NotFoundError) throw new AiError(`Model ${model} isn't available on your OpenAI account.`, 404);
    if (e instanceof OpenAI.RateLimitError) throw new AiError("OpenAI is rate-limiting this key. Wait a moment and try again.", 429);
    if (e instanceof OpenAI.BadRequestError) throw new AiError(`OpenAI rejected the request: ${e.message}`, 400);
    if (e instanceof OpenAI.APIError) throw new AiError(`OpenAI error ${e.status ?? ""}: ${e.message}`, 502);
    if (e instanceof SyntaxError) throw new AiError("The model's reply wasn't valid JSON.", 502);
    throw new AiError("Couldn't reach OpenAI. Check your internet connection.", 502);
  }
}

/** Models your own keys can use, read live from each provider (cached 10 minutes). */
let liveCache: { at: number; anthropic: string[]; openai: string[] } | null = null;
export async function liveModels() {
  if (liveCache && Date.now() - liveCache.at < 600_000) return liveCache;
  const out = { at: Date.now(), anthropic: [] as string[], openai: [] as string[] };
  if (process.env.AI_FAKE !== "1") {
    await Promise.all([
      (async () => {
        if (!process.env.ANTHROPIC_API_KEY) return;
        try {
          for await (const m of new Anthropic().models.list()) out.anthropic.push(m.id);
        } catch {
          /* key missing scope or offline: fall back to the built-in list */
        }
      })(),
      (async () => {
        if (!process.env.OPENAI_API_KEY) return;
        try {
          for await (const m of new OpenAI().models.list()) if (/^(gpt-|o\d)/.test(m.id) && !/(audio|realtime|image|tts|transcribe|search|embedding)/.test(m.id)) out.openai.push(m.id);
        } catch {
          /* fall back to the built-in list */
        }
      })(),
    ]);
  }
  liveCache = out;
  return out;
}

// ---------- test double ----------
function fakeReply(model: string, messages: Msg[], schema: object): unknown {
  const last = messages[messages.length - 1]?.content.toLowerCase() ?? "";
  const isGenerate = "properties" in schema && "products" in (schema as { properties: object }).properties;
  if (isGenerate)
    return {
      name: "Fake Model Goods",
      tagline: `Generated by ${model}`,
      heroHeadline: "Written by a test model",
      heroSub: "This store copy came back from the AI route.",
      accentHex: "#7a3e9d",
      products: [
        { title: "Model-made Mug", description: "A mug described by the fake model.", priceDollars: 24, variants: ["White", "Black"] },
        { title: "Model-made Tote", description: "A tote described by the fake model.", priceDollars: 32, variants: ["Natural"] },
        { title: "Model-made Print", description: "A print described by the fake model.", priceDollars: 45, variants: ["A4", "A3"] },
      ],
      storyTitle: "Made by a model",
      storyBody: "A short story from the fake model.",
    };
  const empty = { percent: null, title: null, hex: null, mode: null, text: null, app: null, on: null, number: null };
  if (last.includes("discount")) return { reply: `(${model}) I can set up a **20%** code for you.`, action: { ...empty, type: "create_discount", percent: 20 } };
  return { reply: `(${model}) Hello from the AI route.`, action: null };
}

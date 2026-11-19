/**
 * Owner-only AI endpoint (protected by middleware like the rest of /api/admin).
 * GET  -> chosen model, which providers have keys, and the model catalogue (+ live lists from your accounts)
 * PUT  -> { aiModel } choose the model
 * POST -> { task: "assistant", store, history } or { task: "generate", prompt, category }
 */
import type { NextRequest } from "next/server";
import { readSettings, writeSettings } from "@/lib/server/db";
import { body, json, rateLimit, sameOrigin } from "@/lib/server/http";
import { AiError, callModel, keys, liveModels, type Part } from "@/lib/server/llm";
import { isMediaId, readMedia } from "@/lib/server/media";
import { CLAUDE_MODELS, OPENAI_MODELS, findModel, providerOf } from "@/lib/ai-models";
import { ASSISTANT_SCHEMA, ASSISTANT_SYSTEM, GENERATE_SCHEMA, GENERATE_SYSTEM } from "@/lib/ai-actions";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, live] = await Promise.all([readSettings(), liveModels()]);
  const known = new Set([...CLAUDE_MODELS, ...OPENAI_MODELS].map((m) => m.id));
  return json({
    aiModel: settings.aiModel,
    keys: keys(),
    extra: { anthropic: live.anthropic.filter((id) => !known.has(id)), openai: live.openai.filter((id) => !known.has(id)) },
    available: { anthropic: live.anthropic, openai: live.openai },
  });
}

const validModel = (id: unknown): id is string => typeof id === "string" && (id === "builtin" || (/^[a-z0-9][a-z0-9.\-]{1,80}$/i.test(id) && providerOf(id) !== "builtin"));

export async function PUT(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: "Bad origin." }, 403);
  const b = await body<{ aiModel?: unknown }>(req, 2_000);
  if (!b || !validModel(b.aiModel)) return json({ error: "Unknown model." }, 400);
  return json(await writeSettings({ aiModel: b.aiModel }));
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: "Bad origin." }, 403);
  // protects your bill if a page loops by mistake
  if (!rateLimit("ai", req, 30, 60_000)) return json({ error: "Too many AI requests in a minute. Take a breath." }, 429);
  const b = await body<Record<string, unknown>>(req, 200_000); // photos are sent by id, not inline
  if (!b) return json({ error: "Bad request." }, 400);
  const model = validModel(b.model) ? b.model : (await readSettings()).aiModel;
  if (model === "builtin") return json({ error: "No AI model selected." }, 400);
  const label = findModel(model)?.label ?? model;

  try {
    if (b.task === "assistant") {
      const history = Array.isArray(b.history) ? b.history : [];
      const msgs = history
        .filter((m): m is { role: "user" | "assistant"; content: string } => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
      if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json({ error: "Bad request." }, 400);
      const system = `${ASSISTANT_SYSTEM}\n\nThe owner is on the "${String(b.page ?? "dashboard").slice(0, 30)}" page.\nStore data (JSON):\n${JSON.stringify(b.store ?? {}).slice(0, 60_000)}`;
      const out = await callModel(model, system, msgs, ASSISTANT_SCHEMA, { effort: "low" });
      return json({ model, label, ...(out as object) });
    }
    if (b.task === "generate") {
      const prompt = typeof b.prompt === "string" ? b.prompt.trim().slice(0, 2000) : "";
      const ids = Array.isArray(b.images) ? b.images.filter(isMediaId).slice(0, 8) : [];
      if (prompt.length < 3 && !ids.length) return json({ error: "Add a photo or describe the store." }, 400);
      const parts: Part[] = [];
      for (const [i, id] of ids.entries()) {
        const m = await readMedia(id);
        if (!m) return json({ error: "A photo is missing. Upload it again." }, 400);
        parts.push({ type: "text", text: `Photo ${i}:` }, { type: "image", mediaType: m.type as "image/webp", data: m.buf.toString("base64") });
      }
      parts.push({ type: "text", text: `${ids.length ? `${ids.length} product photo(s) above.\n` : ""}Owner's notes: ${prompt || "(none — work from the photos)"}\nCategory hint: ${String(b.category ?? "general").slice(0, 20)}` });
      const out = await callModel(model, GENERATE_SYSTEM, [{ role: "user", content: parts }], GENERATE_SCHEMA, { effort: "medium" });
      return json({ model, label, store: out });
    }
    return json({ error: "Unknown task." }, 400);
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError("The AI request failed.");
    return json({ error: err.message }, err.status);
  }
}

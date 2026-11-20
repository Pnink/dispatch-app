/**
 * Owner-only AI endpoint (protected by middleware like the rest of /api/admin).
 * GET  -> chosen model, which providers have keys, and the model catalogue (+ live lists from your accounts)
 * PUT  -> { aiModel } choose the model
 * POST -> { task: "assistant", store, history } or { task: "generate", prompt, category }
 */
import type { NextRequest } from "next/server";
import { addEval, readEvals, readSettings, writeSettings } from "@/lib/server/db";
import { runSpecialist, type SupportOrder } from "@/lib/server/specialist";
import { SPECIALISTS, type Context, type Input, type SpecialistId } from "@/lib/ai/specialists";
import { fallback } from "@/lib/ai/fallbacks";
import { playbook } from "@/lib/ai/playbook";
import { check } from "@/lib/ai/checks";
import { CASES, practiceContext, practiceStore, score } from "@/lib/ai/evals";
import { body, json, rateLimit, sameOrigin } from "@/lib/server/http";
import { AiError, callModel, keys, liveModels, type Part } from "@/lib/server/llm";
import { isMediaId, readMedia } from "@/lib/server/media";
import { CLAUDE_MODELS, OPENAI_MODELS, findModel, providerOf } from "@/lib/ai-models";
import { AUTO, describe, label as modelName, pickModels, type Job, type Plan } from "@/lib/ai/router";
import type { EvalRun } from "@/lib/server/db";
import { ASSISTANT_SCHEMA, ASSISTANT_SYSTEM, GENERATE_SCHEMA, GENERATE_SYSTEM } from "@/lib/ai-actions";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, live, evals] = await Promise.all([readSettings(), liveModels(), readEvals()]);
  const known = new Set([...CLAUDE_MODELS, ...OPENAI_MODELS].map((m) => m.id));
  return json({
    aiModel: settings.aiModel,
    keys: keys(),
    extra: { anthropic: live.anthropic.filter((id) => !known.has(id)), openai: live.openai.filter((id) => !known.has(id)) },
    available: { anthropic: live.anthropic, openai: live.openai },
    evals,
  });
}

const validModel = (id: unknown): id is string => typeof id === "string" && (id === "builtin" || id === AUTO || (/^[a-z0-9][a-z0-9.\-]{1,80}$/i.test(id) && providerOf(id) !== "builtin"));

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
  const chosen = validModel(b.model) ? b.model : (await readSettings()).aiModel;
  const auto = chosen === AUTO;
  const scores = auto ? companyScores(await readEvals()) : {};
  /** Which model(s) to use for this job. null = free rules (no key, or the owner picked them). */
  const planFor = (job: Job, message?: string): Plan | null =>
    auto ? pickModels(job, keys(), { message, scores }) : chosen === "builtin" ? null : { model: chosen, why: "your pick" };
  const nameOf = (p: Plan | null, reviewed = false) => (!p ? "Free rules" : auto ? describe(p, reviewed) : (findModel(p.model)?.label ?? p.model));
  // if one company's API fails, auto mode hands the job to the other company's equivalent model
  async function withBackup<T>(p: Plan, fn: (m: string) => Promise<T>): Promise<{ out: T; plan: Plan }> {
    try {
      return { out: await fn(p.model), plan: p };
    } catch (e) {
      if (!p.backup) throw e;
      return { out: await fn(p.backup), plan: { ...p, model: p.backup, why: `${p.why}; switched company after an error` } };
    }
  }

  // ---- AI team: one specialist run (works with the free rules too) ----
  if (b.task === "specialist") {
    const id = String(b.specialist) as SpecialistId;
    if (!(id in SPECIALISTS) || !b.context || typeof b.context !== "object") return json({ error: "Bad request." }, 400);
    const ctx = b.context as Context;
    const input = (b.input ?? {}) as Input;
    const p = planFor(id);
    try {
      if (!p) {
        const c = check(id, fallback(id, input, ctx), ctx);
        return json({ model: "builtin", label: "Free rules", output: c.output, issues: c.issues, review: { ran: false, passed: true, problems: [], revised: false }, calls: 0 });
      }
      const review = b.review !== false;
      const { out: r, plan } = await withBackup(p, (m) => runSpecialist(m, id, input, ctx, { photo: isMediaId(b.photo) ? b.photo : undefined, order: (b.order ?? null) as SupportOrder, review, reviewer: auto ? p.reviewer : undefined }));
      return json({ model: plan.model, label: nameOf(plan, review), why: auto ? plan.why : undefined, ...r });
    } catch (e) {
      const err = e instanceof AiError ? e : new AiError("The AI request failed.");
      return json({ error: err.message }, err.status);
    }
  }

  // ---- practice tests: score the selected model on fixed questions ----
  if (b.task === "eval") {
    const ctx = practiceContext();
    const ps = practiceStore();
    const free = !planFor("chat");
    const review = b.review !== false && !free;
    const cases = [];
    try {
      for (const c of CASES) {
        let raw: unknown;
        const p = planFor(c.specialist);
        if (!p) raw = fallback(c.specialist, c.input, ctx);
        else {
          const o = c.input.orderNumber ? ps.orders.find((x) => x.number === c.input.orderNumber) : undefined;
          const order: SupportOrder = o ? { number: o.number, status: o.status, createdAt: o.createdAt, items: o.items.map((i) => `${i.qty}x ${i.title}`), firstName: o.customer.name.split(" ")[0], totalCents: o.totalCents } : null;
          raw = (await withBackup(p, (m) => runSpecialist(m, c.specialist, c.input, ctx, { order, review, reviewer: auto ? p.reviewer : undefined }))).out.output;
        }
        cases.push(score(c, raw, ctx));
      }
    } catch (e) {
      const err = e instanceof AiError ? e : new AiError("The practice test failed.");
      return json({ error: err.message }, err.status);
    }
    const run = { at: new Date().toISOString(), model: free ? "builtin" : chosen, label: free ? "Free rules" : auto ? "Auto (picks per task)" : modelName(chosen), review, average: Math.round(cases.reduce((a, c) => a + c.score, 0) / cases.length), cases };
    await addEval(run);
    return json(run);
  }

  try {
    if (b.task === "assistant") {
      const history = Array.isArray(b.history) ? b.history : [];
      const msgs = history
        .filter((m): m is { role: "user" | "assistant"; content: string } => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
      if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json({ error: "Bad request." }, 400);
      const p = planFor("chat", msgs[msgs.length - 1].content);
      if (!p) return json({ error: "No AI model available." }, 400);
      const system = `${ASSISTANT_SYSTEM}\n\n${playbook(["honesty", "voice", "merch", "testing", "pricing"])}\n\nFollow the store's "lessons" in the data: they are what this store has learned and override general advice.\n\nThe owner is on the "${String(b.page ?? "dashboard").slice(0, 30)}" page.\nStore data (JSON):\n${JSON.stringify(b.store ?? {}).slice(0, 60_000)}`;
      const { out, plan } = await withBackup(p, (m) => callModel(m, system, msgs, ASSISTANT_SCHEMA, { effort: p.why.startsWith("needs real thinking") ? "medium" : "low" }));
      return json({ model: plan.model, label: auto ? `${nameOf(plan)} · ${plan.why}` : nameOf(plan), ...(out as object) });
    }
    if (b.task === "generate") {
      const prompt = typeof b.prompt === "string" ? b.prompt.trim().slice(0, 2000) : "";
      const ids = Array.isArray(b.images) ? b.images.filter(isMediaId).slice(0, 8) : [];
      if (prompt.length < 3 && !ids.length) return json({ error: "Add a photo or describe the store." }, 400);
      const p = planFor("build_store");
      if (!p) return json({ error: "No AI model available." }, 400);
      const parts: Part[] = [];
      for (const [i, id] of ids.entries()) {
        const m = await readMedia(id);
        if (!m) return json({ error: "A photo is missing. Upload it again." }, 400);
        parts.push({ type: "text", text: `Photo ${i}:` }, { type: "image", mediaType: m.type as "image/webp", data: m.buf.toString("base64") });
      }
      parts.push({ type: "text", text: `${ids.length ? `${ids.length} product photo(s) above.\n` : ""}Owner's notes: ${prompt || "(none — work from the photos)"}\nCategory hint: ${String(b.category ?? "general").slice(0, 20)}` });
      const { out, plan } = await withBackup(p, (m) => callModel(m, GENERATE_SYSTEM, [{ role: "user", content: parts }], GENERATE_SCHEMA, { effort: "medium" }));
      return json({ model: plan.model, label: nameOf(plan), store: out });
    }
    return json({ error: "Unknown task." }, 400);
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError("The AI request failed.");
    return json({ error: err.message }, err.status);
  }
}

/** Latest practice-test score per company, from runs made with one specific model (not auto). */
function companyScores(evals: EvalRun[]) {
  const out: { anthropic?: number; openai?: number } = {};
  for (const r of evals) {
    const co = providerOf(r.model);
    if (r.model === AUTO || co === "builtin" || out[co] !== undefined) continue;
    out[co] = r.average;
  }
  return out;
}

/**
 * Auto mode: picks the model for every request, and splits work across models.
 *
 * How it decides, per request (no extra AI call, so choosing is free and instant):
 *   1. What's the job?  quick question / real work / deep thinking / building a store / writing / numbers / support.
 *   2. How big a model does it need?  quick -> small cheap model, writing -> mid model, numbers & strategy -> top model.
 *   3. Claude or ChatGPT?  Whichever scored higher on your latest practice test with that company's models;
 *      Claude by default until you've run one for each. Only companies you've added a key for are used.
 *   4. Combined: when you have both keys, a model from the OTHER company checks the work (two different AIs
 *      catch more mistakes than one checking itself), and if one company's API fails, the other takes over.
 */
import type { Provider } from "../ai-models";
import { findModel } from "../ai-models";

export const AUTO = "auto";
export type Tier = "small" | "mid" | "top";
export type Job = "chat" | "build_store" | "product_copy" | "pricing" | "email" | "experiments" | "seo" | "support";
type Co = Exclude<Provider, "builtin">;

const LINEUP: Record<Co, Record<Tier, string>> = {
  anthropic: { small: "claude-haiku-5-5", mid: "claude-sonnet-5-5", top: "claude-opus-5-5" },
  openai: { small: "gpt-6-luna", mid: "gpt-6.2-sol", top: "gpt-6.2-astra" },
};

const JOB_TIER: Record<Exclude<Job, "chat">, { tier: Tier; why: string }> = {
  build_store: { tier: "top", why: "building a whole store from photos needs the strongest model" },
  pricing: { tier: "top", why: "pricing means reasoning over your sales numbers" },
  experiments: { tier: "top", why: "planning tests means reasoning over results" },
  product_copy: { tier: "mid", why: "writing job: a mid model writes as well for less" },
  email: { tier: "mid", why: "writing job: a mid model writes as well for less" },
  seo: { tier: "mid", why: "short, rule-bound writing" },
  support: { tier: "mid", why: "customer reply: careful but quick" },
};

/** Sort a chat message: quick question, real work, or deep thinking. */
export function chatTier(message: string): { tier: Tier; why: string } {
  const m = message.toLowerCase();
  const words = m.split(/\s+/).filter(Boolean).length;
  if (words > 60 || /\b(strategy|plan|why|analy[sz]e|compare|improve|grow|figure out|should i|what would you|best way|launch)\b/.test(m))
    return { tier: "top", why: "needs real thinking" };
  if (/\b(create|make|change|set|add|start|write|rewrite|update|turn|switch|refund|publish|lower|raise|discount|test)\b/.test(m))
    return { tier: "mid", why: "a change to your store" };
  return { tier: "small", why: "quick question" };
}

export type Plan = { model: string; reviewer?: string; backup?: string; why: string };

/**
 * scores: latest practice-test average per company (only counted if run in auto or with that company's model).
 */
export function pickModels(job: Job, keys: { anthropic: boolean; openai: boolean }, opts: { message?: string; scores?: Partial<Record<Co, number>> } = {}): Plan | null {
  const have = (["anthropic", "openai"] as Co[]).filter((c) => keys[c]);
  if (!have.length) return null;
  const { tier, why } = job === "chat" ? chatTier(opts.message ?? "") : JOB_TIER[job];
  const s = opts.scores ?? {};
  // pick the company: higher practice-test score wins; Claude on a tie or with no scores yet
  const first: Co = have.length === 1 ? have[0] : (s.openai ?? -1) > (s.anthropic ?? -1) ? "openai" : "anthropic";
  const other = have.find((c) => c !== first);
  const model = LINEUP[first][tier];
  const scoreNote = have.length > 1 && s.anthropic !== undefined && s.openai !== undefined ? `; ${first === "anthropic" ? "Claude" : "ChatGPT"} scored higher on your practice test` : "";
  return {
    model,
    // checker: the other company's mid model (different AI = fresh eyes); same company's mid if only one key
    reviewer: other ? LINEUP[other].mid : LINEUP[first].mid,
    backup: other ? LINEUP[other][tier] : undefined,
    why: `${why}${scoreNote}`,
  };
}

export const label = (id: string) => findModel(id)?.label ?? id;

export function describe(plan: Plan, reviewed: boolean) {
  return reviewed && plan.reviewer && plan.reviewer !== plan.model ? `Auto: ${label(plan.model)} wrote it, ${label(plan.reviewer)} checked it` : `Auto: ${label(plan.model)}`;
}

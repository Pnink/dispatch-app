/**
 * AI models the owner can pick for the assistant and store generation.
 * Prices are USD per 1M tokens (input / output), standard tier.
 *
 * Claude: Anthropic's published first-party rates (model list cached 2026-11-03).
 * OpenAI: GPT-6.2 Astra / Sol, GPT-6 Astra and GPT-6.1 Sol are OpenAI's official rates as seen 2026-11-19.
 *         Terra / Luna figures come from third-party price trackers and are marked unverified.
 * The settings screen also lists every model your own API keys can use (read live from each provider),
 * so new models appear without code changes.
 */
export type Provider = "builtin" | "anthropic" | "openai";

export type ModelInfo = {
  id: string;
  provider: Provider;
  label: string;
  input?: number;
  output?: number;
  note?: string;
  priceUnverified?: boolean;
  /** Claude: accepts output_config.effort */
  effort?: boolean;
  /** Claude: server-side refusal fallbacks (beta) — "default" routing */
  fallbacks?: boolean;
};

export const BUILTIN: ModelInfo = { id: "builtin", provider: "builtin", label: "Built-in rules (free, offline)", note: "No API key. Fast, predictable, limited." };

export const CLAUDE_MODELS: ModelInfo[] = [
  { id: "claude-fable-5-2", provider: "anthropic", label: "Claude Fable 5.2", input: 8, output: 40, note: "Most capable widely released Claude", effort: true, fallbacks: true },
  { id: "claude-fable-5-1", provider: "anthropic", label: "Claude Fable 5.1", input: 10, output: 50, effort: true, fallbacks: true },
  { id: "claude-fable-5", provider: "anthropic", label: "Claude Fable 5", input: 10, output: 50, effort: true },
  { id: "claude-mythos-5-2", provider: "anthropic", label: "Claude Mythos 5.2", input: 8, output: 40, note: "Verified organizations only", effort: true },
  { id: "claude-mythos-5-1", provider: "anthropic", label: "Claude Mythos 5.1", input: 10, output: 50, note: "Verified organizations only", effort: true },
  { id: "claude-opus-5-5", provider: "anthropic", label: "Claude Opus 5.5", input: 4, output: 20, note: "Recommended default", effort: true, fallbacks: true },
  { id: "claude-opus-5", provider: "anthropic", label: "Claude Opus 5", input: 5, output: 25, effort: true, fallbacks: true },
  { id: "claude-opus-4-8", provider: "anthropic", label: "Claude Opus 4.8", input: 5, output: 25, effort: true },
  { id: "claude-opus-4-7", provider: "anthropic", label: "Claude Opus 4.7", input: 5, output: 25, effort: true },
  { id: "claude-opus-4-6", provider: "anthropic", label: "Claude Opus 4.6", input: 5, output: 25, effort: true },
  { id: "claude-sonnet-5-5", provider: "anthropic", label: "Claude Sonnet 5.5", input: 2, output: 10, note: "Fast and capable", effort: true, fallbacks: true },
  { id: "claude-sonnet-5", provider: "anthropic", label: "Claude Sonnet 5", input: 2, output: 10, effort: true },
  { id: "claude-sonnet-4-6", provider: "anthropic", label: "Claude Sonnet 4.6", input: 3, output: 15, effort: true },
  { id: "claude-haiku-5-5", provider: "anthropic", label: "Claude Haiku 5.5", input: 0.1, output: 0.5, note: "Cheapest Claude", effort: true },
  { id: "claude-haiku-4-5", provider: "anthropic", label: "Claude Haiku 4.5", input: 1, output: 5 },
];

export const OPENAI_MODELS: ModelInfo[] = [
  { id: "gpt-6.2-astra", provider: "openai", label: "GPT-6.2 Astra", input: 8, output: 40, note: "OpenAI flagship" },
  { id: "gpt-6-astra", provider: "openai", label: "GPT-6 Astra", input: 10, output: 50 },
  { id: "gpt-6.2-sol", provider: "openai", label: "GPT-6.2 Sol", input: 2, output: 10, note: "Mid-size" },
  { id: "gpt-6.1-sol", provider: "openai", label: "GPT-6.1 Sol", input: 2, output: 10 },
  { id: "gpt-6.1-terra", provider: "openai", label: "GPT-6.1 Terra", input: 1, output: 5, priceUnverified: true },
  { id: "gpt-6-luna", provider: "openai", label: "GPT-6 Luna", input: 0.1, output: 0.5, note: "Cheapest", priceUnverified: true },
];

export const KNOWN_MODELS: ModelInfo[] = [BUILTIN, ...CLAUDE_MODELS, ...OPENAI_MODELS];

export function findModel(id: string): ModelInfo | undefined {
  return KNOWN_MODELS.find((m) => m.id === id);
}

/** A model id read live from a provider that isn't in our list yet. */
export function unknownModel(id: string, provider: Provider): ModelInfo {
  return { id, provider, label: id, note: "From your account (price not listed here)" };
}

export const providerOf = (id: string): Provider => (id === "builtin" ? "builtin" : id.startsWith("claude") ? "anthropic" : "openai");

/** Rough cost of one call, in US cents. */
export function estimateCents(m: ModelInfo, inputTokens: number, outputTokens: number) {
  if (m.input === undefined || m.output === undefined) return undefined;
  return ((inputTokens * m.input + outputTokens * m.output) / 1_000_000) * 100;
}

"use client";
import { useState } from "react";
import { Check, KeyRound, Sparkles } from "lucide-react";
import { setAiModel, useAiSettings } from "@/lib/ai-client";
import { BUILTIN, CLAUDE_MODELS, OPENAI_MODELS, estimateCents, unknownModel, type ModelInfo } from "@/lib/ai-models";
import { cx } from "@/lib/format";
import { Panel } from "./PageHeader";

const price = (m: ModelInfo) => (m.input === undefined ? "price not listed" : `$${m.input} / $${m.output} per 1M tokens${m.priceUnverified ? " (unverified)" : ""}`);
const perReply = (m: ModelInfo) => {
  const c = estimateCents(m, 3000, 600); // a typical assistant turn: store data in, short answer out
  return c === undefined ? "" : c < 0.1 ? "<0.1¢ a reply" : `≈${c < 1 ? c.toFixed(1) : Math.round(c)}¢ a reply`;
};

export function AiModelPanel() {
  const ai = useAiSettings();
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  if (!ai) return <Panel title="AI model"><p className="p-5 text-sm text-muted">Loading…</p></Panel>;

  const choose = async (id: string) => {
    setSaving(id);
    setError("");
    try {
      await setAiModel(id);
    } catch (e) {
      setError((e as Error).message);
    }
    setSaving(null);
  };

  const AUTO_INFO: ModelInfo = { id: "auto", provider: "builtin", label: "Auto — picks for every message (recommended)", note: "Small cheap model for quick questions, mid for writing, top for numbers and building stores. With both keys: Claude and ChatGPT check each other's work and back each other up. Free rules until you add a key." };
  const groups: { title: string; key?: "anthropic" | "openai"; env?: string; models: ModelInfo[] }[] = [
    { title: "Let Kovaz choose", models: [AUTO_INFO] },
    { title: "Free", models: [BUILTIN] },
    { title: "Claude (Anthropic)", key: "anthropic", env: "ANTHROPIC_API_KEY", models: [...CLAUDE_MODELS, ...ai.extra.anthropic.map((id) => unknownModel(id, "anthropic"))] },
    { title: "ChatGPT models (OpenAI)", key: "openai", env: "OPENAI_API_KEY", models: [...OPENAI_MODELS, ...ai.extra.openai.map((id) => unknownModel(id, "openai"))] },
  ];

  return (
    <section id="ai" className="scroll-mt-20">
      <Panel title="AI model" action={<span className="flex items-center gap-1 text-xs text-muted"><Sparkles className="h-3 w-3 text-accent" /> Used by the assistant, AI team and store builder</span>}>
        <div className="space-y-6 p-5">
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          {groups.map((g) => {
            const hasKey = g.key ? ai.keys[g.key] : true;
            const live = g.key ? ai.available[g.key] : [];
            return (
              <fieldset key={g.title}>
                <legend className="flex w-full items-center justify-between text-sm font-semibold">
                  {g.title}
                  {g.key && (
                    <span className={cx("flex items-center gap-1 text-xs font-normal", hasKey ? "text-success" : "text-muted")}>
                      <KeyRound className="h-3 w-3" /> {hasKey ? "Key added" : `Add ${g.env} to .env.local to use these`}
                    </span>
                  )}
                </legend>
                <div className="mt-2 grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
                  {g.models.map((m) => {
                    const selected = ai.aiModel === m.id;
                    const onAccount = !g.key || !live.length || live.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={!hasKey || saving !== null}
                        onClick={() => choose(m.id)}
                        className={cx(
                          "flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                          selected ? "border-accent bg-accent-soft" : "border-border hover:border-border-input",
                        )}
                      >
                        <span className={cx("mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border", selected ? "border-accent bg-accent text-on-accent" : "border-border-input")}>
                          {selected && <Check className="h-3 w-3" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium">{m.label}</span>
                          <span className="block font-mono text-[11px] text-muted">{m.id}</span>
                          <span className="mt-1 block text-xs text-muted">
                            {m.provider === "builtin" ? m.note : `${price(m)} · ${perReply(m)}`}
                          </span>
                          {m.provider !== "builtin" && m.note && <span className="block text-xs text-muted">{m.note}</span>}
                          {!onAccount && <span className="block text-xs text-buoy">Not listed on your account</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
          <p className="text-xs text-muted">
            Keys are read only on the server from <code className="rounded bg-surface px-1">.env.local</code>; they&apos;re never sent to the browser or saved with your store data.
            Provider bills are separate from any ChatGPT or Claude.ai subscription. Your customers&apos; names, emails and addresses are never sent to a model.
          </p>
        </div>
      </Panel>
    </section>
  );
}

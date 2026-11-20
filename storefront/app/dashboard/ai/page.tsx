"use client";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { AlertTriangle, BookOpen, Brain, Check, ClipboardCopy, FileText, FlaskConical, Gauge, Headphones, Mail, Search, ShieldCheck, Tag, Trash2, Wrench } from "lucide-react";
import { updateStore, useCurrentStore } from "@/lib/store";
import { isFree, modelName, runPracticeTest, runSpecialist, useAiSettings, type SpecialistResult } from "@/lib/ai-client";
import { SPECIALIST_LIST, type Input, type SpecialistId } from "@/lib/ai/specialists";
import { addLesson, applyEmail, applyPrice, applyProductCopy, applySeo, startTest } from "@/lib/ai/apply";
import type { EmailFlowKind, Store } from "@/lib/types";
import { PageHeader, Panel } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui";
import { cx, money } from "@/lib/format";

const ICONS: Record<SpecialistId, typeof FileText> = { product_copy: FileText, pricing: Tag, email: Mail, experiments: FlaskConical, seo: Search, support: Headphones };
const FLOW_LABEL: Record<EmailFlowKind, string> = { welcome: "Welcome", abandoned_checkout: "Abandoned checkout", post_purchase: "After purchase", review_request: "Review request" };
const REVIEW_KEY = "sf:ai-review";

export default function AiTeamPage() {
  const store = useCurrentStore()!;
  const ai = useAiSettings();
  const [active, setActive] = useState<SpecialistId>("product_copy");
  const [review, setReview] = useState(true);
  useEffect(() => {
    try {
      const v = localStorage.getItem(REVIEW_KEY);
      if (v !== null) setReview(v === "1");
    } catch {
      /* ignore */
    }
  }, []);
  const free = isFree(ai);
  const modelLabel = modelName(ai) || "Free rules";

  return (
    <>
      <PageHeader
        title="AI team"
        sub="Six specialists that know e-commerce, read your store's data and memory, and get their work checked before you see it. Nothing changes until you click apply."
        actions={
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted">Model: <Link href="/dashboard/settings#ai" className="font-medium text-text underline">{modelLabel}</Link></span>
          </div>
        }
      />
      {free && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-buoy/30 bg-buoy/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-buoy" aria-hidden />
          <p>You&apos;re on the <strong>free rules</strong>: careful, but basic. For the real specialists, add a Claude or ChatGPT key (see <Link href="/dashboard/settings#ai" className="underline">Settings → AI model</Link>).</p>
        </div>
      )}

      <div className="grid gap-6 2xl:grid-cols-[380px_1fr]">
        <div className="grid content-start gap-2 sm:grid-cols-2 2xl:grid-cols-1" role="tablist" aria-label="Specialists">
          {SPECIALIST_LIST.map((sp) => {
            const Icon = ICONS[sp.id];
            return (
              <button
                key={sp.id}
                role="tab"
                aria-selected={active === sp.id}
                onClick={() => setActive(sp.id)}
                className={cx("flex gap-3 rounded-xl border p-4 text-left", active === sp.id ? "border-accent bg-accent-soft" : "border-border bg-bg hover:border-border-input")}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
                <span>
                  <span className="block font-semibold">{sp.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">{sp.job}</span>
                </span>
              </button>
            );
          })}
        </div>
        <Workspace key={active} id={active} store={store} review={review && !free} />
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={review}
          disabled={free}
          onChange={(e) => {
            setReview(e.target.checked);
            try {
              localStorage.setItem(REVIEW_KEY, e.target.checked ? "1" : "0");
            } catch {
              /* ignore */
            }
          }}
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        Double-check every answer with an AI editor (better quality, about 2× the cost per run)
      </label>

      <div className="mt-8 grid gap-6 2xl:grid-cols-2">
        <Memory store={store} />
        <Quality modelLabel={modelLabel} isFree={free} />
      </div>
    </>
  );
}

// ---------- one specialist at work ----------
function Workspace({ id, store, review }: { id: SpecialistId; store: Store; review: boolean }) {
  const sp = SPECIALIST_LIST.find((s) => s.id === id)!;
  const active = store.products.filter((p) => p.status === "active");
  const [input, setInput] = useState<Input>({ productId: active[0]?.id ?? null, kind: "abandoned_checkout" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SpecialistResult | null>(null);
  const [applied, setApplied] = useState<string[]>([]);
  const apply = (key: string, fn: (s: Store) => Store, lesson?: string) => {
    updateStore(store.slug, (s) => (lesson ? addLesson(lesson, "ai")(fn(s)) : fn(s)));
    setApplied((a) => [...a, key]);
  };

  const run = async () => {
    setBusy(true);
    setError("");
    setResult(null);
    setApplied([]);
    const r = await runSpecialist(id, input, store, review);
    setBusy(false);
    if (r.ok) setResult(r.data);
    else setError(r.error);
  };

  const field = "h-10 w-full rounded-md border border-border-input/60 px-3 text-sm outline-none focus:border-accent";
  return (
    <Panel title={sp.name}>
      <div className="space-y-4 p-5">
        {(id === "product_copy" || id === "pricing") && (
          <div>
            <label htmlFor="sp-product" className="mb-1 block text-sm font-medium">Product</label>
            <select id="sp-product" value={input.productId ?? ""} onChange={(e) => setInput({ ...input, productId: e.target.value || null })} className={field}>
              {id === "pricing" && <option value="">All products</option>}
              {active.map((p) => <option key={p.id} value={p.id}>{p.title} — {money(p.priceCents)}</option>)}
            </select>
          </div>
        )}
        {id === "email" && (
          <div>
            <label htmlFor="sp-flow" className="mb-1 block text-sm font-medium">Which email</label>
            <select id="sp-flow" value={input.kind} onChange={(e) => setInput({ ...input, kind: e.target.value as EmailFlowKind })} className={field}>
              {store.flows.map((f) => <option key={f.kind} value={f.kind}>{FLOW_LABEL[f.kind]}</option>)}
            </select>
          </div>
        )}
        {(id === "product_copy" || id === "email") && (
          <div>
            <label htmlFor="sp-focus" className="mb-1 block text-sm font-medium">Anything to focus on? <span className="font-normal text-muted">(optional)</span></label>
            <input id="sp-focus" value={input.focus ?? ""} onChange={(e) => setInput({ ...input, focus: e.target.value })} placeholder={id === "email" ? "e.g. mention we restock every Friday" : "e.g. it makes a great gift; it's 100% soy wax"} className={field} />
          </div>
        )}
        {id === "support" && (
          <>
            <div>
              <label htmlFor="sp-msg" className="mb-1 block text-sm font-medium">Customer&apos;s message</label>
              <textarea id="sp-msg" rows={4} value={input.message ?? ""} onChange={(e) => setInput({ ...input, message: e.target.value })} placeholder="Paste the email or DM here" className="w-full rounded-md border border-border-input/60 p-3 text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label htmlFor="sp-order" className="mb-1 block text-sm font-medium">Order number <span className="font-normal text-muted">(optional)</span></label>
              <input id="sp-order" inputMode="numeric" value={input.orderNumber ?? ""} onChange={(e) => setInput({ ...input, orderNumber: e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null })} placeholder="e.g. 1004" className={field} />
            </div>
          </>
        )}
        {(id === "experiments" || id === "seo") && <p className="text-sm text-muted">{id === "seo" ? `Covers all ${active.length} active products.` : "Looks at your sales, current tests and past results."}</p>}

        <Button onClick={run} loading={busy} disabled={(id === "product_copy" && !input.productId) || (id === "support" && !(input.message ?? "").trim())}>
          <Brain className="h-4 w-4" /> {busy ? "Working…" : "Ask the specialist"}
        </Button>
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}

        {result && (
          <div className="space-y-4 border-t border-border pt-4" data-specialist-result>
            <Checks result={result} />
            <Output id={id} result={result} store={store} input={input} applied={applied} apply={apply} />
          </div>
        )}
      </div>
    </Panel>
  );
}

function Checks({ result }: { result: SpecialistResult }) {
  const blocked = result.issues.filter((i) => i.level === "blocked");
  const warnings = result.issues.filter((i) => i.level === "warning");
  const fixed = result.issues.filter((i) => i.level === "fixed");
  const r = result.review;
  return (
    <div className="space-y-2 text-sm" aria-label="Quality checks">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-surface px-2 py-0.5 text-muted" title={result.why}>by {result.label}{result.why ? ` · ${result.why}` : ""}</span>
        {r.ran && (
          <span className={cx("flex items-center gap-1 rounded-full px-2 py-0.5", r.passed && !r.revised ? "bg-success/10 text-success" : "bg-accent-soft text-accent")}>
            <ShieldCheck className="h-3 w-3" /> {r.revised ? `Editor found ${r.problems.length} problem${r.problems.length === 1 ? "" : "s"} — fixed` : "Editor approved"}
          </span>
        )}
        <span className={cx("flex items-center gap-1 rounded-full px-2 py-0.5", blocked.length ? "bg-danger/10 text-danger" : warnings.length ? "bg-amber-100 text-amber-800" : "bg-success/10 text-success")}>
          <Check className="h-3 w-3" /> Rule check: {blocked.length ? `${blocked.length} blocking` : warnings.length ? `${warnings.length} to review` : "passed"}
        </span>
        {fixed.length > 0 && <span className="flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-muted"><Wrench className="h-3 w-3" /> {fixed.length} auto-fixed</span>}
      </div>
      {r.revised && r.problems.length > 0 && <ul className="list-disc pl-5 text-xs text-muted">{r.problems.map((p) => <li key={p}>Editor: {p}</li>)}</ul>}
      {[...blocked, ...warnings, ...fixed].length > 0 && (
        <ul className="space-y-1 text-xs">
          {[...blocked, ...warnings, ...fixed].map((i, k) => (
            <li key={k} className={i.level === "blocked" ? "text-danger" : i.level === "warning" ? "text-amber-800" : "text-muted"}>{i.level === "blocked" ? "Blocked: " : i.level === "warning" ? "Check: " : "Fixed: "}{i.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function Output({ id, result, store, input, applied, apply }: { id: SpecialistId; result: SpecialistResult; store: Store; input: Input; applied: string[]; apply: (key: string, fn: (s: Store) => Store, lesson?: string) => void }) {
  const o = result.output;
  const blocked = result.issues.some((i) => i.level === "blocked");
  const ApplyBtn = ({ k, onClick, children }: { k: string; onClick: () => void; children: React.ReactNode }) =>
    applied.includes(k) ? <span className="flex items-center gap-1 text-sm text-success"><Check className="h-4 w-4" /> Applied</span> : <Button size="sm" onClick={onClick} disabled={blocked}>{children}</Button>;
  const productTitle = (pid: string) => store.products.find((p) => p.id === pid)?.title ?? "product";

  if (id === "product_copy")
    return (
      <div className="space-y-3">
        <div className="rounded-lg bg-surface p-4">
          <div className="text-lg font-semibold">{o.title}</div>
          <p className="mt-2 text-sm">{o.description}</p>
          {o.bullets?.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm">{o.bullets.map((b: string) => <li key={b}>{b}</li>)}</ul>}
          <div className="mt-3 border-t border-border pt-2 text-xs text-muted">Google: <span className="text-accent">{o.seoTitle}</span> — {o.metaDescription}</div>
        </div>
        <ApplyBtn k="copy" onClick={() => apply("copy", applyProductCopy(input.productId!, o))}>Use this on the product page</ApplyBtn>
      </div>
    );
  if (id === "pricing")
    return (
      <div className="space-y-3">
        <p className="text-sm">{o.summary}</p>
        {o.suggestions.map((s: any, i: number) => {
          const p = store.products.find((x) => x.id === s.productId)!;
          return (
            <div key={i} className="rounded-lg bg-surface p-4 text-sm">
              <div className="font-medium">{p.title}: {money(p.priceCents)} → {money(s.suggestedCents)} <span className="text-xs font-normal text-muted">({s.confidence} confidence)</span></div>
              <p className="mt-1 text-muted">{s.reasoning}</p>
              <div className="mt-3 flex gap-2">
                <ApplyBtn k={`test${i}`} onClick={() => apply(`test${i}`, startTest("price", String(s.suggestedCents / 100), p.id, `${p.title} price`))}>Test {money(s.suggestedCents)}</ApplyBtn>
                {!s.testInstead && <ApplyBtn k={`price${i}`} onClick={() => apply(`price${i}`, applyPrice(p.id, s.suggestedCents))}>Just change it</ApplyBtn>}
              </div>
            </div>
          );
        })}
        {o.needToKnow?.length > 0 && <p className="text-xs text-muted">Would help to know: {o.needToKnow.join("; ")}. Add it under Memory below.</p>}
      </div>
    );
  if (id === "email")
    return (
      <div className="space-y-3">
        <div className="rounded-lg bg-surface p-4 text-sm">
          <div className="text-xs text-muted">Subject</div>
          <div className="font-medium">{o.subject}</div>
          <div className="mt-1 text-xs text-muted">{o.preheader}</div>
          <p className="mt-3 whitespace-pre-line">{o.body}</p>
        </div>
        <ApplyBtn k="email" onClick={() => apply("email", applyEmail(input.kind!, o))}>Use this email</ApplyBtn>
      </div>
    );
  if (id === "experiments")
    return (
      <div className="space-y-3">
        {o.ideas.length === 0 && <p className="text-sm text-muted">No new test worth running right now.</p>}
        {o.ideas.map((x: any, i: number) => (
          <div key={i} className="rounded-lg bg-surface p-4 text-sm">
            <div className="font-medium">{x.kind === "headline" ? `Headline: “${x.bValue}”` : x.kind === "price" ? `${productTitle(x.productId)} at $${x.bValue}` : x.kind === "free_shipping" ? `Free shipping over $${x.bValue}` : `${x.bValue}% first-order discount`}</div>
            <p className="mt-1">{x.hypothesis}</p>
            <p className="mt-1 text-xs text-muted">{x.why}</p>
            <div className="mt-3"><ApplyBtn k={`exp${i}`} onClick={() => apply(`exp${i}`, startTest(x.kind, x.bValue, x.productId, x.hypothesis))}>Start this test</ApplyBtn></div>
          </div>
        ))}
      </div>
    );
  if (id === "seo")
    return (
      <div className="space-y-3">
        <ul className="space-y-2 text-sm">
          {o.items.map((x: any) => (
            <li key={x.productId} className="rounded-lg bg-surface p-3">
              <div className="text-accent">{x.seoTitle}</div>
              <div className="text-xs text-muted">{x.metaDescription}</div>
            </li>
          ))}
        </ul>
        <ApplyBtn k="seo" onClick={() => apply("seo", applySeo(o.items))}>Apply to all {o.items.length} products</ApplyBtn>
      </div>
    );
  // support
  return (
    <div className="space-y-3">
      {o.needsOwner && <p className="flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800"><AlertTriangle className="h-4 w-4" /> Needs your decision{o.reason ? `: ${o.reason}` : ""}</p>}
      <div className="whitespace-pre-line rounded-lg bg-surface p-4 text-sm">{o.reply}</div>
      <Button size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(o.reply)}><ClipboardCopy className="h-4 w-4" /> Copy reply</Button>
    </div>
  );
}

// ---------- memory ----------
function Memory({ store }: { store: Store }) {
  const [text, setText] = useState("");
  const lessons = store.lessons ?? [];
  const tag = { owner: "You said", result: "Test result", ai: "Saved" } as const;
  return (
    <Panel title="Memory" action={<span className="flex items-center gap-1 text-xs text-muted"><BookOpen className="h-3 w-3" /> Every specialist reads this</span>}>
      <div className="space-y-4 p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim().length < 4) return;
            updateStore(store.slug, addLesson(text, "owner"));
            setText("");
          }}
          className="flex gap-2"
        >
          <label htmlFor="lesson" className="sr-only">Teach it something about your business</label>
          <input id="lesson" value={text} onChange={(e) => setText(e.target.value)} placeholder="Teach it something: e.g. Our buyers are mostly gift shoppers; never discount over 15%" className="h-10 flex-1 rounded-md border border-border-input/60 px-3 text-sm outline-none focus:border-accent" />
          <Button type="submit" disabled={text.trim().length < 4}>Remember</Button>
        </form>
        {lessons.length === 0 ? (
          <p className="text-sm text-muted">Nothing yet. Add facts about your customers, supplier, costs or rules — and finished A/B tests will add their results here automatically.</p>
        ) : (
          <ul className="divide-y divide-border">
            {lessons.map((l) => (
              <li key={l.id} className="flex items-start gap-3 py-2.5 text-sm">
                <span className={cx("mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase", l.source === "result" ? "bg-success/10 text-success" : l.source === "owner" ? "bg-accent-soft text-accent" : "bg-surface text-muted")}>{tag[l.source]}</span>
                <span className="flex-1">{l.text}</span>
                <button onClick={() => updateStore(store.slug, (s) => ({ ...s, lessons: s.lessons.filter((x) => x.id !== l.id) }))} aria-label="Forget this" className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

// ---------- practice tests ----------
function Quality({ modelLabel, isFree }: { modelLabel: string; isFree: boolean }) {
  const ai = useAiSettings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const runs = ai?.evals ?? [];
  return (
    <Panel title="How good is it?" action={<span className="flex items-center gap-1 text-xs text-muted"><Gauge className="h-3 w-3" /> Practice tests</span>}>
      <div className="space-y-4 p-5">
        <p className="text-sm text-muted">
          Seven practice questions on a sample candle shop with known facts (e.g. it must not invent a burn time, must flag refund requests for you).
          Run it after changing model or memory and compare scores.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            loading={busy}
            onClick={async () => {
              if (!isFree && !confirm(`This makes about 7–21 calls to ${modelLabel} (a few cents to ~50¢). Run it?`)) return;
              setBusy(true);
              setError("");
              const r = await runPracticeTest(true);
              setBusy(false);
              if (!r.ok) setError(r.error);
            }}
          >
            Run practice test with {modelLabel}
          </Button>
          {error && <span className="text-sm text-danger">{error}</span>}
        </div>
        {runs.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr><th className="py-1.5 font-normal">When</th><th className="font-normal">Model</th><th className="text-right font-normal">Score</th></tr>
            </thead>
            <tbody>
              {runs.slice(0, 8).map((r) => (
                <Fragment key={r.at}>
                  <tr className="cursor-pointer border-t border-border hover:bg-surface/60" onClick={() => setOpen(open === r.at ? null : r.at)}>
                    <td className="py-2">{new Date(r.at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                    <td>{r.label}{r.review ? " + editor" : ""}</td>
                    <td className={cx("text-right font-semibold tabular-nums", r.average >= 85 ? "text-success" : r.average >= 70 ? "text-text" : "text-danger")} data-eval-score>{r.average}/100</td>
                  </tr>
                  {open === r.at && (
                    <tr>
                      <td colSpan={3} className="pb-3">
                        <ul className="space-y-1 text-xs">
                          {r.cases.map((c) => (
                            <li key={c.name} className="flex justify-between gap-3">
                              <span>{c.name}{c.failures.length > 0 && <span className="text-danger"> — {c.failures.join("; ")}</span>}</span>
                              <span className="tabular-nums">{c.score}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Panel>
  );
}

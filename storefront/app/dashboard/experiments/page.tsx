"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, FlaskConical, Pause, Play, Plus, Sparkles, Trash2, Trophy, Users, X } from "lucide-react";
import { suggestHeadlines } from "@/lib/ai";
import { KIND_LABEL, conflict, controlValue, endExperiment, experimentStats, newExperiment, simulateTraffic, type ExperimentStats } from "@/lib/experiments";
import { updateStore, useCurrentStore } from "@/lib/store";
import type { Experiment, ExperimentKind, Store } from "@/lib/types";
import { cx, dateShort, money } from "@/lib/format";
import { PageHeader, Panel } from "@/components/dashboard/PageHeader";
import { Badge, Button, Chip, Field } from "@/components/ui";

export default function ExperimentsPage() {
  return (
    <Suspense>
      <Experiments />
    </Suspense>
  );
}

function fmtValue(exp: Experiment, v: string | number) {
  if (exp.kind === "headline") return `“${v}”`;
  if (exp.kind === "popup_offer") return `${v}% off first order`;
  if (exp.kind === "free_shipping") return Number(v) === 0 ? "No free shipping" : `Free over ${money(Number(v))}`;
  return money(Number(v));
}

const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;

function StatusBadge({ exp }: { exp: Experiment }) {
  if (exp.status === "running") return <Badge tone="accent">Running</Badge>;
  if (exp.status === "paused") return <Badge tone="warning">Paused</Badge>;
  return <Badge tone={exp.winner === "b" ? "success" : "neutral"}>{exp.winner === "b" ? "B won" : exp.winner === "a" ? "A kept" : "Ended"}</Badge>;
}

function Experiments() {
  const store = useCurrentStore()!;
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [creating, setCreating] = useState(false);
  const selected = store.experiments.find((e) => e.id === params.get("id"));
  const open = (id?: string) => router.replace(id ? `${pathname}?id=${id}` : pathname, { scroll: false });

  if (selected) return <Detail store={store} exp={selected} onBack={() => open()} />;

  const running = store.experiments.filter((e) => e.status !== "completed");
  const done = store.experiments.filter((e) => e.status === "completed");

  return (
    <>
      <PageHeader
        title="Experiments"
        sub="Show two versions to different visitors and keep the one that sells better."
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New experiment</Button>}
      />
      {store.experiments.length === 0 ? (
        <Panel>
          <div className="px-6 py-16 text-center">
            <FlaskConical className="mx-auto h-8 w-8 text-accent" aria-hidden />
            <h2 className="mt-3 font-semibold">No experiments yet</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">Test a homepage headline, a product price, your free-shipping threshold or the popup discount. Half your visitors see each version.</p>
            <Button className="mt-5" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Start your first test</Button>
          </div>
        </Panel>
      ) : (
        <div className="space-y-8">
          {running.length > 0 && <ExpList title="Active" items={running} onOpen={open} />}
          {done.length > 0 && <ExpList title="Finished" items={done} onOpen={open} />}
        </div>
      )}
      <Panel title="How results are decided" className="mt-8">
        <p className="px-5 py-4 text-sm text-muted">
          Each visitor is assigned A or B and keeps it. We count unique visitors and the orders they place, then estimate the chance that B is genuinely
          better (Bayesian). Headline and shipping tests compare <strong>conversion rate</strong>; price and discount tests compare <strong>revenue per visitor</strong>,
          because a cheaper price can win more orders but earn less. With auto-rollout on, the winner is applied once both versions have enough visitors and we&apos;re 95% sure.
        </p>
      </Panel>
      {creating && (
        <NewExperiment
          store={store}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            open(id);
          }}
        />
      )}
    </>
  );
}

function ExpList({ title, items, onOpen }: { title: string; items: Experiment[]; onOpen: (id: string) => void }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-muted">{title}</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((e) => {
          const st = experimentStats(e);
          return (
            <button key={e.id} onClick={() => onOpen(e.id)} className="rounded-xl border border-border bg-bg p-5 text-left hover:border-border-input">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{e.name}</div>
                  <div className="text-xs text-muted">{KIND_LABEL[e.kind]} · started {dateShort(e.createdAt)}</div>
                </div>
                <StatusBadge exp={e} />
              </div>
              <ProbBar st={st} compact />
              <div className="mt-3 flex gap-4 text-xs text-muted">
                <span>{(st.a.views + st.b.views).toLocaleString()} visitors</span>
                <span>{st.a.conversions + st.b.conversions} orders</span>
                {st.a.views > 0 && st.b.views > 0 && <span className={st.lift >= 0 ? "text-success" : "text-danger"}>B {st.lift >= 0 ? "+" : ""}{pct(st.lift)}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ProbBar({ st, compact }: { st: ExperimentStats; compact?: boolean }) {
  const p = st.probBBetter;
  return (
    <div className={compact ? "mt-4" : ""}>
      <div className="flex justify-between text-xs">
        <span className="text-muted">A better {pct(1 - p, 0)}</span>
        <span className="font-medium">B better {pct(p, 0)}</span>
      </div>
      <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-surface" role="img" aria-label={`${pct(p, 0)} chance B is better`}>
        <div className="bg-border-input/50" style={{ width: `${(1 - p) * 100}%` }} />
        <div className={p >= 0.95 ? "bg-success" : p <= 0.05 ? "bg-danger" : "bg-accent"} style={{ width: `${p * 100}%` }} />
      </div>
    </div>
  );
}

function verdict(exp: Experiment, st: ExperimentStats) {
  if (exp.status === "completed") {
    if (exp.winner === "b") return "B won and is now live for everyone.";
    if (exp.winner === "a") return "A was kept. Nothing changed on your store.";
    return "Ended without a winner. Nothing changed on your store.";
  }
  if (st.a.views + st.b.views === 0) return "Waiting for visitors. Open your storefront, or simulate traffic to see how results build up.";
  if (!st.enoughData) return `Collecting data — each version needs ${exp.minSample} visitors before we call it (A: ${st.a.views}, B: ${st.b.views}).`;
  if (st.decisive) return st.leader === "b" ? "B is the winner with 95%+ confidence." : "A is the winner with 95%+ confidence.";
  return "Too close to call yet. Keep it running.";
}

function Detail({ store, exp, onBack }: { store: Store; exp: Experiment; onBack: () => void }) {
  const st = experimentStats(exp);
  const set = (fn: (s: Store) => Store) => updateStore(store.slug, fn);
  const patch = (p: Partial<Experiment>) => set((s) => ({ ...s, experiments: s.experiments.map((e) => (e.id === exp.id ? { ...e, ...p } : e)) }));
  const simulated = st.a.simulatedViews + st.b.simulatedViews;
  const metricLabel = st.metric === "revenue" ? "revenue per visitor" : "conversion rate";
  const product = store.products.find((p) => p.id === exp.productId);
  const previewPath = exp.kind === "price" && product ? `/store/${store.slug}/p/${product.id}` : `/store/${store.slug}`;

  return (
    <>
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-text"><ArrowLeft className="h-4 w-4" /> All experiments</button>
      <PageHeader
        title={exp.name}
        sub={`${KIND_LABEL[exp.kind]}${product ? ` · ${product.title}` : ""} · goal: higher ${metricLabel}`}
        actions={<StatusBadge exp={exp} />}
      />

      <div className={cx("mb-6 rounded-xl border p-4 text-sm", st.decisive || exp.status === "completed" ? "border-success/30 bg-success/5" : "border-border bg-bg")} role="status">
        <div className="flex items-center gap-2 font-medium">{(st.decisive || exp.winner === "b") && <Trophy className="h-4 w-4 text-success" />}{verdict(exp, st)}</div>
        {simulated > 0 && <p className="mt-1 text-xs text-muted">Includes {simulated.toLocaleString()} simulated visitors (demo traffic).</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[st.a, st.b].map((v) => {
          const leading = st.leader === v.id || exp.winner === v.id;
          return (
            <section key={v.id} className={cx("rounded-xl border bg-bg p-5", leading ? "border-success" : "border-border")}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">{v.id === "a" ? "A · current" : "B · challenger"}</span>
                {exp.status !== "completed" && (
                  <Link href={`${previewPath}?ab=${exp.id}.${v.id}`} target="_blank" className="flex items-center gap-1 text-xs text-accent hover:underline"><Eye className="h-3.5 w-3.5" /> Preview</Link>
                )}
              </div>
              <p className="mt-2 min-h-12 font-medium">{fmtValue(exp, v.value)}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Stat k="Visitors" v={v.views.toLocaleString()} />
                <Stat k="Orders" v={v.conversions.toLocaleString()} />
                <Stat k="Conversion" v={pct(v.cr, 2)} strong={st.metric === "conversion"} />
                <Stat k="Revenue / visitor" v={money(v.rpv)} strong={st.metric === "revenue"} />
              </dl>
            </section>
          );
        })}
      </div>

      <Panel className="mt-4">
        <div className="space-y-4 p-5">
          <ProbBar st={st} />
          {st.a.views > 0 && st.b.views > 0 && (
            <p className="text-sm text-muted">
              B is <strong className={st.lift >= 0 ? "text-success" : "text-danger"}>{st.lift >= 0 ? "+" : ""}{pct(st.lift)}</strong> on {metricLabel} compared with A.
            </p>
          )}
        </div>
      </Panel>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {exp.status !== "completed" && (
          <>
            <Button variant="secondary" onClick={() => set((s) => simulateTraffic(s, exp.id, 250))} disabled={exp.status !== "running"}>
              <Users className="h-4 w-4" /> Simulate 250 visitors
            </Button>
            {exp.status === "running" ? (
              <Button variant="secondary" onClick={() => patch({ status: "paused" })}><Pause className="h-4 w-4" /> Pause</Button>
            ) : (
              <Button variant="secondary" onClick={() => patch({ status: "running" })}><Play className="h-4 w-4" /> Resume</Button>
            )}
            <Button onClick={() => confirm("Make B live for every visitor and end the test?") && set((s) => endExperiment(s, exp.id, "b"))}>Roll out B</Button>
            <Button variant="ghost" onClick={() => confirm("Keep A and end the test?") && set((s) => endExperiment(s, exp.id, "a"))}>Keep A</Button>
          </>
        )}
        <Button
          variant="danger"
          className="ml-auto"
          onClick={() => {
            if (confirm(`Delete "${exp.name}" and its results? (Any rolled-out change stays.)`)) {
              set((s) => ({ ...s, experiments: s.experiments.filter((e) => e.id !== exp.id) }));
              onBack();
            }
          }}
        >
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>

      {exp.status !== "completed" && (
        <label className="mt-6 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={exp.autoPromote} onChange={(e) => patch({ autoPromote: e.target.checked })} className="h-4 w-4 accent-[var(--color-accent)]" />
          Automatically roll out the winner when results are clear (95% confidence, {exp.minSample}+ visitors each)
        </label>
      )}
      <p className="mt-6 text-xs text-muted">
        Preview links show one version in this browser session without counting toward results. Visitors from this browser count once per experiment.
      </p>
    </>
  );
}

function Stat({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={cx("rounded-lg p-3", strong ? "bg-accent-soft" : "bg-surface")}>
      <dt className="text-xs text-muted">{k}{strong && " · goal"}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums">{v}</dd>
    </div>
  );
}

const KINDS: { kind: ExperimentKind; desc: string }[] = [
  { kind: "headline", desc: "Which homepage message gets more people to buy?" },
  { kind: "price", desc: "Does a different price earn more per visitor?" },
  { kind: "free_shipping", desc: "Where should free shipping kick in?" },
  { kind: "popup_offer", desc: "How big should the first-order discount be?" },
];

function NewExperiment({ store, onClose, onCreated }: { store: Store; onClose: () => void; onCreated: (id: string) => void }) {
  const [kind, setKind] = useState<ExperimentKind>("headline");
  const [productId, setProductId] = useState(store.products[0]?.id);
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [amount, setAmount] = useState("");
  const [minSample, setMinSample] = useState(100);
  const [autoPromote, setAutoPromote] = useState(true);
  const [error, setError] = useState("");
  const suggestions = suggestHeadlines(store).slice(0, 4);
  const control = controlValue(store, kind, productId);

  const create = () => {
    const clash = conflict(store, kind, productId);
    if (clash) return setError(clash);
    let b: string | number;
    if (kind === "headline") {
      if (!headline.trim()) return setError("Write the headline for version B.");
      if (headline.trim() === store.heroHeadline) return setError("Version B must be different from what's live now.");
      b = headline.trim();
    } else if (kind === "popup_offer") {
      const n = Math.round(Number(amount));
      if (!(n >= 1 && n <= 90)) return setError("Enter a discount between 1 and 90%.");
      if (n === store.popup.percent) return setError("Version B must differ from the current discount.");
      b = n;
    } else {
      if (kind === "price" && !productId) return setError("Pick a product.");
      const cents = Math.round(Number(amount) * 100);
      if (!Number.isFinite(cents) || cents < 0 || (kind === "price" && cents === 0) || amount.trim() === "") return setError(kind === "price" ? "Enter a price above zero." : "Enter an amount (0 turns free shipping off).");
      if (cents === Number(control)) return setError("Version B must differ from what's live now.");
      b = cents;
    }
    const exp = newExperiment(store, kind, b, { name, productId: kind === "price" ? productId : undefined, autoPromote, minSample });
    updateStore(store.slug, (s) => ({ ...s, experiments: [exp, ...s.experiments] }));
    onCreated(exp.id);
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-4" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="New experiment" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-xl bg-bg p-6 shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">New experiment</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-surface"><X className="h-5 w-5" /></button>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium">What do you want to test?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {KINDS.map((k) => (
              <button
                key={k.kind}
                type="button"
                role="radio"
                aria-checked={kind === k.kind}
                onClick={() => {
                  setKind(k.kind);
                  setAmount("");
                  setError("");
                }}
                className={cx("rounded-lg border p-3 text-left", kind === k.kind ? "border-accent bg-accent-soft" : "border-border hover:border-border-input")}
              >
                <div className="text-sm font-medium">{KIND_LABEL[k.kind]}</div>
                <div className="text-xs text-muted">{k.desc}</div>
              </button>
            ))}
          </div>
        </fieldset>

        {kind === "price" && (
          <div className="mt-4">
            <label htmlFor="exp-product" className="mb-1 block text-sm font-medium">Product</label>
            <select id="exp-product" value={productId} onChange={(e) => setProductId(e.target.value)} className="h-10 w-full rounded-md border border-border-input/60 px-3 text-sm">
              {store.products.map((p) => <option key={p.id} value={p.id}>{p.title} — {money(p.priceCents)}</option>)}
            </select>
          </div>
        )}

        <div className="mt-4 rounded-lg bg-surface p-3 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">A · live now</span>
          <p className="mt-1">
            {kind === "headline" ? `“${control}”` : kind === "popup_offer" ? `${control}% off first order` : kind === "free_shipping" ? (Number(control) ? `Free over ${money(Number(control))}` : "No free shipping") : money(Number(control))}
          </p>
        </div>

        <div className="mt-4">
          {kind === "headline" ? (
            <>
              <label htmlFor="exp-b" className="mb-1 block text-sm font-medium">B · new headline</label>
              <input id="exp-b" value={headline} onChange={(e) => setHeadline(e.target.value)} className="h-10 w-full rounded-md border border-border-input/60 px-3 text-sm outline-none focus:border-accent" />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1 text-xs text-muted"><Sparkles className="h-3 w-3 text-accent" /> Ideas:</span>
                {suggestions.map((s) => <Chip key={s} onClick={() => setHeadline(s)} selected={headline === s} className="text-xs">{s}</Chip>)}
              </div>
            </>
          ) : (
            <Field
              label={kind === "price" ? "B · new price (USD)" : kind === "free_shipping" ? "B · free shipping over (USD)" : "B · discount (%)"}
              name="exp-b"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              hint={kind === "popup_offer" ? `Shoppers in B get code WELCOME${amount || "…"}` : kind === "free_shipping" ? "0 turns free shipping off for version B" : undefined}
            />
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name (optional)" name="exp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={KIND_LABEL[kind]} />
          <div>
            <label htmlFor="exp-min" className="mb-1 block text-sm font-medium">Visitors per version before deciding</label>
            <select id="exp-min" value={minSample} onChange={(e) => setMinSample(Number(e.target.value))} className="h-10 w-full rounded-md border border-border-input/60 px-3 text-sm">
              {[50, 100, 250, 500, 1000].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={autoPromote} onChange={(e) => setAutoPromote(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
          Roll out the winner automatically
        </label>

        {error && <p className="mt-4 text-sm text-danger" role="alert">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={create}><FlaskConical className="h-4 w-4" /> Start experiment</Button>
        </div>
      </div>
    </div>
  );
}


"use client";
import { useState } from "react";
import { money, cx } from "@/lib/format";

type Hosting = "free" | "paid";

export function CostCalculator() {
  const [orders, setOrders] = useState(60);
  const [aov, setAov] = useState(55);
  const [hosting, setHosting] = useState<Hosting>("paid");
  const [db, setDb] = useState<"free" | "paid">("free");
  const [ai, setAi] = useState(true);

  const sales = orders * aov * 100;
  const processor = Math.round(sales * 0.029 + orders * 30);
  const rows: { item: string; note: string; cents: number }[] = [
    { item: "This platform", note: "All features, any number of stores", cents: 0 },
    { item: "Card processing", note: "≈2.9% + 30¢ per card charge (typical Stripe US online rate)", cents: processor },
    { item: "Hosting", note: hosting === "paid" ? "A paid plan that allows commercial use (≈$20/mo)" : "A free tier that allows commercial use — check the terms", cents: hosting === "paid" ? 2000 : 0 },
    { item: "Database", note: db === "paid" ? "Paid tier once you outgrow free (≈$25/mo)" : "Free tier is plenty to start", cents: db === "paid" ? 2500 : 0 },
    { item: "Domain", note: "≈$15 a year", cents: 125 },
    { item: "Transactional email", note: "Free tiers cover a few thousand emails a month", cents: 0 },
    { item: "AI assistant", note: ai ? "Claude API, pay per use: ≈2¢ per assistant reply, ≈5–10¢ per generated store (daily use ≈ $5–15)" : "Off", cents: ai ? 1000 : 0 },
  ];
  const total = rows.reduce((a, r) => a + r.cents, 0);
  const fixed = total - processor;

  const slider = "w-full accent-[var(--color-accent)]";
  return (
    <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.3fr]">
      <div className="space-y-6 rounded-2xl border border-border bg-surface p-6">
        <div>
          <label htmlFor="orders" className="flex justify-between text-sm font-medium">Orders a month <span className="tabular-nums">{orders}</span></label>
          <input id="orders" type="range" min={0} max={1000} step={10} value={orders} onChange={(e) => setOrders(Number(e.target.value))} className={slider} />
        </div>
        <div>
          <label htmlFor="aov" className="flex justify-between text-sm font-medium">Average order <span className="tabular-nums">${aov}</span></label>
          <input id="aov" type="range" min={10} max={300} step={5} value={aov} onChange={(e) => setAov(Number(e.target.value))} className={slider} />
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Hosting</legend>
          <div className="mt-2 flex gap-2">
            {(["free", "paid"] as const).map((h) => (
              <button key={h} type="button" aria-pressed={hosting === h} onClick={() => setHosting(h)} className={cx("rounded-full border px-3 py-1.5 text-sm", hosting === h ? "border-ink bg-ink text-on-ink" : "border-border bg-bg")}>
                {h === "free" ? "Free tier" : "Paid plan"}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium">Database</legend>
          <div className="mt-2 flex gap-2">
            {(["free", "paid"] as const).map((h) => (
              <button key={h} type="button" aria-pressed={db === h} onClick={() => setDb(h)} className={cx("rounded-full border px-3 py-1.5 text-sm", db === h ? "border-ink bg-ink text-on-ink" : "border-border bg-bg")}>
                {h === "free" ? "Free tier" : "Paid tier"}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={ai} onChange={(e) => setAi(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" /> Use a real AI model for the assistant
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-bg">
        <div className="border-b border-border px-6 py-5">
          <div className="text-sm text-muted">On {money(sales)} of sales a month</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-5xl tabular-nums">{money(total)}</span>
            <span className="text-muted">/ month</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            <strong className="text-text">{money(fixed)}</strong> fixed + {money(processor)} card fees (you&apos;d pay those on any platform).
          </p>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.item} className="border-b border-border last:border-0">
                <td className="px-6 py-3">
                  <div className="font-medium">{r.item}</div>
                  <div className="text-xs text-muted">{r.note}</div>
                </td>
                <td className={cx("px-6 py-3 text-right tabular-nums", r.cents === 0 && "text-success")}>{r.cents === 0 ? "$0" : money(r.cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-border bg-accent-soft px-6 py-4 text-sm">
          For comparison, hosted AI store platforms list plans from roughly <strong>$49 to $299 a month</strong> before card fees — and some add a
          per-sale platform fee on top.
        </div>
      </div>
    </section>
  );
}

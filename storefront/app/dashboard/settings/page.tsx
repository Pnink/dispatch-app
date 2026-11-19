"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteStore, resetDemo, updateStore, useCurrentStore } from "@/lib/store";
import { PageHeader, Panel } from "@/components/dashboard/PageHeader";
import { Button, Field, Toggle } from "@/components/ui";

export default function SettingsPage() {
  const store = useCurrentStore()!;
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pct, setPct] = useState("15");
  const [err, setErr] = useState("");

  const addCode = () => {
    const c = code.trim().toUpperCase().replace(/\s/g, "");
    const p = Number(pct);
    if (!/^[A-Z0-9_-]{3,20}$/.test(c)) return setErr("Codes are 3–20 letters or numbers.");
    if (!(p >= 1 && p <= 90)) return setErr("Percent must be between 1 and 90.");
    if (store.discounts.some((d) => d.code === c)) return setErr("That code already exists.");
    updateStore(store.slug, (s) => ({ ...s, discounts: [...s.discounts, { code: c, percent: p }] }));
    setCode("");
    setErr("");
  };

  return (
    <>
      <PageHeader title="Settings" />
      <div className="max-w-3xl space-y-6">
        <Panel title="Store">
          <div className="space-y-4 p-5">
            <Field label="Store name" name="name" value={store.name} onChange={(e) => updateStore(store.slug, (s) => ({ ...s, name: e.target.value }))} />
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">Storefront visible to shoppers</div>
                <div className="text-xs text-muted">When off, visitors see a &ldquo;coming soon&rdquo; page.</div>
              </div>
              <Toggle checked={store.published} onChange={(v) => updateStore(store.slug, (s) => ({ ...s, published: v }))} label="Published" />
            </div>
            <div className="rounded-md bg-surface px-3 py-2 text-xs text-muted">
              Address: <span className="font-mono">/store/{store.slug}</span> · Custom domains are not part of this demo.
            </div>
          </div>
        </Panel>

        <Panel title="Shipping">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Flat rate (USD)" name="ship" inputMode="decimal" defaultValue={(store.shippingCents / 100).toFixed(2)} onBlur={(e) => updateStore(store.slug, (s) => ({ ...s, shippingCents: Math.max(0, Math.round(Number(e.target.value) * 100) || 0) }))} />
            <Field label="Free shipping over (USD)" name="free" inputMode="decimal" hint="Set to 0 to turn off free shipping" defaultValue={(store.freeShippingCents / 100).toFixed(2)} onBlur={(e) => updateStore(store.slug, (s) => ({ ...s, freeShippingCents: Math.max(0, Math.round(Number(e.target.value) * 100) || 0) }))} />
          </div>
        </Panel>

        <Panel title="Discount codes">
          <ul className="divide-y divide-border">
            {store.discounts.map((d) => (
              <li key={d.code} className="flex items-center justify-between px-5 py-3 text-sm">
                <span><span className="font-mono font-medium">{d.code}</span> <span className="text-muted">· {d.percent}% off</span></span>
                <button onClick={() => updateStore(store.slug, (s) => ({ ...s, discounts: s.discounts.filter((x) => x.code !== d.code) }))} aria-label={`Delete ${d.code}`} className="rounded p-1.5 text-muted hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
            {store.discounts.length === 0 && <li className="px-5 py-4 text-sm text-muted">No codes yet.</li>}
          </ul>
          <form onSubmit={(e) => { e.preventDefault(); addCode(); }} className="flex flex-wrap items-end gap-3 border-t border-border p-5">
            <Field label="New code" name="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SPRING20" className="flex-1" />
            <Field label="% off" name="pct" type="number" min={1} max={90} value={pct} onChange={(e) => setPct(e.target.value)} className="w-24" />
            <Button type="submit">Add code</Button>
            {err && <p className="w-full text-xs text-danger" role="alert">{err}</p>}
          </form>
        </Panel>

        <Panel title="Danger zone">
          <div className="flex flex-wrap gap-3 p-5">
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(`Delete ${store.name}? This can't be undone.`)) {
                  deleteStore(store.slug);
                  router.push("/dashboard");
                }
              }}
            >
              Delete this store
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (confirm("Reset the whole demo? All stores and orders in this browser will be replaced with the sample store.")) {
                  resetDemo();
                  router.push("/dashboard");
                }
              }}
            >
              Reset demo data
            </Button>
          </div>
        </Panel>
      </div>
    </>
  );
}

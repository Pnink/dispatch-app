"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, Upload } from "lucide-react";
import { deleteStore, downloadBackup, downloadCsv, eraseEverything, restoreBackup, updateStore, useCurrentStore } from "@/lib/store";
import { PageHeader, Panel } from "@/components/dashboard/PageHeader";
import { AiModelPanel } from "@/components/dashboard/AiModelPanel";
import { CostsPanel, PaymentsPanel, PoliciesPanel } from "@/components/dashboard/BusinessPanels";
import { Button, Field, Toggle } from "@/components/ui";

export default function SettingsPage() {
  const store = useCurrentStore()!;
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pct, setPct] = useState("15");
  const [err, setErr] = useState("");
  const [restoreMsg, setRestoreMsg] = useState<{ ok: boolean; text: string } | null>(null);

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
      <div className="max-w-5xl space-y-6">
        <AiModelPanel />

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

        <PaymentsPanel />

        <Panel title="Shipping">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Flat rate (USD)" name="ship" inputMode="decimal" defaultValue={(store.shippingCents / 100).toFixed(2)} onBlur={(e) => updateStore(store.slug, (s) => ({ ...s, shippingCents: Math.max(0, Math.round(Number(e.target.value) * 100) || 0) }))} />
            <Field label="Free shipping over (USD)" name="free" inputMode="decimal" hint="Set to 0 to turn off free shipping" defaultValue={(store.freeShippingCents / 100).toFixed(2)} onBlur={(e) => updateStore(store.slug, (s) => ({ ...s, freeShippingCents: Math.max(0, Math.round(Number(e.target.value) * 100) || 0) }))} />
          </div>
        </Panel>

        <CostsPanel store={store} />

        <PoliciesPanel store={store} />

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

        <Panel title="Your data">
          <div className="space-y-4 p-5">
            <p className="text-sm text-muted">It&apos;s yours. Take all of it, any time, in formats any other platform can read. Product photos are stored in the <code className="rounded bg-surface px-1">data/uploads</code> folder — to move everything, copy the whole <code className="rounded bg-surface px-1">data</code> folder.</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadBackup}><Download className="h-4 w-4" /> Full backup (.json)</Button>
              <Button variant="secondary" onClick={() => downloadCsv(store, "orders")}>Orders CSV</Button>
              <Button variant="secondary" onClick={() => downloadCsv(store, "products")}>Products CSV</Button>
              <Button variant="secondary" onClick={() => downloadCsv(store, "subscribers")}>Email list CSV</Button>
            </div>
            <div className="rounded-md border border-dashed border-border-input/60 p-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <Upload className="h-4 w-4" aria-hidden /> Restore from a backup file
                <input
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    if (!confirm("Replace everything in this browser with the backup? Download a backup first if you're unsure.")) return;
                    const error = restoreBackup(await f.text());
                    setRestoreMsg(error ? { ok: false, text: error } : { ok: true, text: "Restored." });
                  }}
                />
              </label>
              <p className="mt-1 text-xs text-muted">Replaces all stores, orders and settings.</p>
              {restoreMsg && <p className={`mt-2 text-xs ${restoreMsg.ok ? "text-success" : "text-danger"}`} role="status">{restoreMsg.text}</p>}
            </div>
          </div>
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
                if (confirm("Erase every store, product and order? Download a backup first. (Automatic backups on disk are kept.)")) {
                  eraseEverything();
                  router.push("/dashboard");
                }
              }}
            >
              Erase everything
            </Button>
          </div>
        </Panel>
      </div>
    </>
  );
}

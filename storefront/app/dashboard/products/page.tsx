"use client";
import { useState } from "react";
import { Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { draftProduct, uid } from "@/lib/ai";
import { updateStore, useCurrentStore } from "@/lib/store";
import type { Product, Store } from "@/lib/types";
import { money } from "@/lib/format";
import { PageHeader, Panel } from "@/components/dashboard/PageHeader";
import { ProductArt } from "@/components/ProductArt";
import { Badge, Button, Field } from "@/components/ui";

export default function ProductsPage() {
  const store = useCurrentStore()!;
  const [editing, setEditing] = useState<Product | null>(null);

  const blank = (): Product => ({ id: uid(), title: "", description: "", priceCents: 0, variants: [], stock: 0, status: "active", seoTitle: "", art: Math.floor(Math.random() * 1e6) });

  return (
    <>
      <PageHeader
        title="Products"
        sub={`${store.products.length} products · ${store.products.reduce((a, p) => a + p.stock, 0)} units in stock`}
        actions={<Button onClick={() => setEditing(blank())}><Plus className="h-4 w-4" /> Add product</Button>}
      />
      <Panel>
        {store.products.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-muted">No products yet.</p>
            <Button className="mt-4" onClick={() => setEditing(blank())}><Plus className="h-4 w-4" /> Add your first product</Button>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface/60 text-xs text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Product</th>
                  <th className="px-2 font-medium">Status</th>
                  <th className="px-2 font-medium">Inventory</th>
                  <th className="px-2 font-medium">Variants</th>
                  <th className="px-2 text-right font-medium">Price</th>
                  <th className="px-5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {store.products.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <ProductArt seed={p.art} title={p.title} category={store.category} accent={store.palette.accent} soft={store.palette.soft} className="h-10 w-10 shrink-0 rounded-md" />
                        <span className="font-medium">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-2"><Badge tone={p.status === "active" ? "success" : "neutral"}>{p.status === "active" ? "Active" : "Draft"}</Badge></td>
                    <td className="px-2">
                      <span className={p.stock === 0 ? "text-danger" : p.stock < 10 ? "text-amber-700" : ""}>{p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}</span>
                    </td>
                    <td className="px-2 text-muted">{p.variants.length || "—"}</td>
                    <td className="px-2 text-right tabular-nums">{money(p.priceCents)}</td>
                    <td className="px-5 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditing(p)} aria-label={`Edit ${p.title}`} className="rounded p-1.5 text-muted hover:bg-surface hover:text-text"><Pencil className="h-4 w-4" /></button>
                        <button
                          onClick={() => confirm(`Delete "${p.title}"?`) && updateStore(store.slug, (s) => ({ ...s, products: s.products.filter((x) => x.id !== p.id) }))}
                          aria-label={`Delete ${p.title}`}
                          className="rounded p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {editing && <Editor store={store} initial={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function Editor({ store, initial, onClose }: { store: Store; initial: Product; onClose: () => void }) {
  const isNew = !store.products.some((p) => p.id === initial.id);
  const [p, setP] = useState(initial);
  const [price, setPrice] = useState(initial.priceCents ? (initial.priceCents / 100).toFixed(2) : "");
  const [variants, setVariants] = useState(initial.variants.join(", "));
  const [drafting, setDrafting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const draft = () => {
    if (!p.title.trim()) {
      setErrors({ title: "Type a product name first, then let the assistant fill in the rest." });
      return;
    }
    setDrafting(true);
    setTimeout(() => {
      const d = draftProduct(p.title, store);
      setP({ ...d, id: p.id });
      setPrice((d.priceCents / 100).toFixed(2));
      setVariants(d.variants.join(", "));
      setErrors({});
      setDrafting(false);
    }, 700);
  };

  const save = () => {
    const errs: Record<string, string> = {};
    if (!p.title.trim()) errs.title = "Give the product a name.";
    const cents = Math.round(Number(price) * 100);
    if (!price || !Number.isFinite(cents) || cents <= 0) errs.price = "Enter a price above zero.";
    if (p.stock < 0) errs.stock = "Stock can't be negative.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const product: Product = {
      ...p,
      title: p.title.trim(),
      priceCents: cents,
      variants: variants.split(",").map((v) => v.trim()).filter(Boolean),
      seoTitle: p.seoTitle || `${p.title.trim()} | ${store.name}`,
    };
    updateStore(store.slug, (s) => ({
      ...s,
      products: isNew ? [product, ...s.products] : s.products.map((x) => (x.id === product.id ? product : x)),
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-4" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={isNew ? "Add product" : "Edit product"} className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-bg p-6 shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isNew ? "Add product" : "Edit product"}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-surface"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 space-y-4">
          <div className="flex items-end gap-2">
            <Field label="Product name" name="title" value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} error={errors.title} className="flex-1" autoFocus />
            <Button type="button" variant="secondary" onClick={draft} loading={drafting} className={errors.title ? "mb-5" : ""}>
              <Sparkles className="h-4 w-4 text-accent" /> Draft with AI
            </Button>
          </div>
          <div>
            <label htmlFor="desc" className="mb-1 block text-sm font-medium">Description</label>
            <textarea id="desc" rows={4} value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} className="w-full rounded-md border border-border-input/60 p-3 text-sm outline-none focus:border-accent" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (USD)" name="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} error={errors.price} />
            <Field label="Stock" name="stock" type="number" min={0} value={String(p.stock)} onChange={(e) => setP({ ...p, stock: Number(e.target.value) })} error={errors.stock} />
          </div>
          <Field label="Variants" name="variants" value={variants} onChange={(e) => setVariants(e.target.value)} hint="Comma separated, e.g. S, M, L" />
          <Field label="Search title (SEO)" name="seo" value={p.seoTitle} onChange={(e) => setP({ ...p, seoTitle: e.target.value })} hint={`${p.seoTitle.length}/60 characters`} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={p.status === "active"} onChange={(e) => setP({ ...p, status: e.target.checked ? "active" : "draft" })} className="h-4 w-4 accent-[var(--color-accent)]" />
            Visible on storefront
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{isNew ? "Add product" : "Save changes"}</Button>
        </div>
      </div>
    </div>
  );
}

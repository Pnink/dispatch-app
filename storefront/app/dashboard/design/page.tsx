"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { assistant } from "@/lib/ai";
import { updateStore, useCurrentStore } from "@/lib/store";
import type { Palette } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StoreHeader, StoreHome, StoreTheme } from "@/components/storefront";
import { Button, Chip } from "@/components/ui";
import { SectionsEditor } from "@/components/dashboard/SectionsEditor";

const SWATCHES: { key: keyof Palette; label: string }[] = [
  { key: "accent", label: "Accent" },
  { key: "onAccent", label: "Text on accent" },
  { key: "bg", label: "Background" },
  { key: "soft", label: "Section background" },
  { key: "text", label: "Text" },
];

export default function DesignPage() {
  const store = useCurrentStore()!;
  const [ask, setAsk] = useState("");
  const [note, setNote] = useState("");
  const patch = (fn: Parameters<typeof updateStore>[1]) => updateStore(store.slug, fn);

  const restyle = (text: string) => {
    const r = assistant(text, store, "design");
    if (r.action) {
      patch(r.action.apply);
      setNote(`Applied: ${r.action.label}`);
    } else setNote("Try something like “go darker”, “make it blue” or “new headline”.");
    setAsk("");
  };

  return (
    <>
      <PageHeader title="Design" sub="Describe a change, rearrange the homepage, or tweak the details. The preview updates live." />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-bg p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-accent" /> Restyle with AI</h2>
            <form onSubmit={(e) => { e.preventDefault(); if (ask.trim()) restyle(ask); }} className="mt-3 flex gap-2">
              <label htmlFor="restyle" className="sr-only">Describe a design change</label>
              <input id="restyle" value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="e.g. make it feel darker and moodier" className="h-10 flex-1 rounded-md border border-border-input/60 px-3 text-sm outline-none focus:border-accent" />
              <Button type="submit" size="md">Apply</Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Go darker", "Lighter", "Make it green", "Make it navy", "New headline"].map((s) => <Chip key={s} onClick={() => restyle(s)} className="text-xs">{s}</Chip>)}
            </div>
            {note && <p className="mt-3 text-xs text-success" role="status">{note}</p>}
          </section>

          <section className="rounded-xl border border-border bg-bg p-5">
            <h2 className="text-sm font-semibold">Colours</h2>
            <div className="mt-3 space-y-2">
              {SWATCHES.map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between gap-3 text-sm">
                  {label}
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">{store.palette[key]}</span>
                    <input type="color" value={store.palette[key]} onChange={(e) => patch((s) => ({ ...s, palette: { ...s.palette, [key]: e.target.value } }))} className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" />
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-bg p-5">
            <h2 className="text-sm font-semibold">Type & copy</h2>
            <div className="flex gap-2" role="radiogroup" aria-label="Heading style">
              {(["serif", "sans"] as const).map((f) => (
                <Chip key={f} selected={store.font === f} onClick={() => patch((s) => ({ ...s, font: f }))} className={f === "serif" ? "font-serif" : ""}>{f === "serif" ? "Serif headings" : "Sans headings"}</Chip>
              ))}
            </div>
            <div>
              <label htmlFor="headline" className="mb-1 block text-xs text-muted">Homepage headline</label>
              <input id="headline" value={store.heroHeadline} onChange={(e) => patch((s) => ({ ...s, heroHeadline: e.target.value }))} className="h-10 w-full rounded-md border border-border-input/60 px-3 text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label htmlFor="sub" className="mb-1 block text-xs text-muted">Subheading</label>
              <textarea id="sub" rows={3} value={store.heroSub} onChange={(e) => patch((s) => ({ ...s, heroSub: e.target.value }))} className="w-full rounded-md border border-border-input/60 p-3 text-sm outline-none focus:border-accent" />
            </div>
          </section>
          <SectionsEditor store={store} />
        </div>

        <section aria-label="Live preview" className="overflow-hidden rounded-xl border border-border shadow-card">
          <div className="max-h-[80vh] overflow-y-auto">
            <StoreTheme store={store}>
              <StoreHeader store={store} base={`/store/${store.slug}`} />
              <StoreHome store={store} base={`/store/${store.slug}`} />
            </StoreTheme>
          </div>
        </section>
      </div>
    </>
  );
}

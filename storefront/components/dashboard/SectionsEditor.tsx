"use client";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { SECTION_LABEL } from "@/lib/sections";
import { updateStore } from "@/lib/store";
import type { Section, Store } from "@/lib/types";
import { cx } from "@/lib/format";

const input = "w-full rounded-md border border-border-input/60 px-3 py-2 text-sm outline-none focus:border-accent";

export function SectionsEditor({ store }: { store: Store }) {
  const patch = (fn: (s: Store) => Store) => updateStore(store.slug, fn);
  const setSections = (sections: Section[]) => patch((s) => ({ ...s, sections }));
  const move = (i: number, d: -1 | 1) => {
    const next = [...store.sections];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next);
  };

  return (
    <>
      <section className="rounded-xl border border-border bg-bg p-5">
        <h2 className="text-sm font-semibold">Homepage sections</h2>
        <p className="mt-1 text-xs text-muted">Reorder or hide. The preview updates as you go.</p>
        <ol className="mt-3 space-y-1.5">
          {store.sections.map((s, i) => (
            <li key={s.id} className={cx("flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm", !s.enabled && "opacity-50")}>
              <span className="w-4 text-xs text-muted tabular-nums">{i + 1}</span>
              <span className="flex-1">{SECTION_LABEL[s.id]}</span>
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${SECTION_LABEL[s.id]} up`} className="rounded p-1 hover:bg-surface disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button onClick={() => move(i, 1)} disabled={i === store.sections.length - 1} aria-label={`Move ${SECTION_LABEL[s.id]} down`} className="rounded p-1 hover:bg-surface disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button
                onClick={() => setSections(store.sections.map((x) => (x.id === s.id ? { ...x, enabled: !x.enabled } : x)))}
                aria-label={`${s.enabled ? "Hide" : "Show"} ${SECTION_LABEL[s.id]}`}
                aria-pressed={s.enabled}
                className="rounded p-1 hover:bg-surface"
              >
                {s.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-bg p-5">
        <h2 className="text-sm font-semibold">Announcement bar</h2>
        <label htmlFor="announcement" className="sr-only">Announcement text</label>
        <input id="announcement" value={store.announcement} onChange={(e) => patch((s) => ({ ...s, announcement: e.target.value }))} placeholder="Leave empty to hide the bar" className={input} />
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-bg p-5">
        <h2 className="text-sm font-semibold">Brand story</h2>
        <div>
          <label htmlFor="story-title" className="mb-1 block text-xs text-muted">Title</label>
          <input id="story-title" value={store.story.title} onChange={(e) => patch((s) => ({ ...s, story: { ...s.story, title: e.target.value } }))} className={input} />
        </div>
        <div>
          <label htmlFor="story-body" className="mb-1 block text-xs text-muted">Text</label>
          <textarea id="story-body" rows={5} value={store.story.body} onChange={(e) => patch((s) => ({ ...s, story: { ...s.story, body: e.target.value } }))} className={input} />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-bg p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Storefront questions</h2>
          <button onClick={() => patch((s) => ({ ...s, faqs: [...s.faqs, { q: "New question", a: "Answer" }] }))} className="flex items-center gap-1 text-xs text-accent hover:underline">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {!store.sections.find((s) => s.id === "faq")?.enabled && <p className="text-xs text-muted">The Questions section is hidden — show it above to use these.</p>}
        {store.faqs.map((f, i) => (
          <div key={i} className="space-y-1.5 rounded-md bg-surface p-2.5">
            <div className="flex gap-2">
              <label className="sr-only" htmlFor={`faq-q-${i}`}>Question {i + 1}</label>
              <input id={`faq-q-${i}`} value={f.q} onChange={(e) => patch((s) => ({ ...s, faqs: s.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) }))} className={cx(input, "bg-bg font-medium")} />
              <button onClick={() => patch((s) => ({ ...s, faqs: s.faqs.filter((_, j) => j !== i) }))} aria-label={`Delete question ${i + 1}`} className="rounded p-1.5 text-muted hover:bg-danger/10 hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <label className="sr-only" htmlFor={`faq-a-${i}`}>Answer {i + 1}</label>
            <textarea id={`faq-a-${i}`} rows={2} value={f.a} onChange={(e) => patch((s) => ({ ...s, faqs: s.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) }))} className={cx(input, "bg-bg")} />
          </div>
        ))}
      </section>
    </>
  );
}

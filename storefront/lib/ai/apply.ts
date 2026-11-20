/** Turning an approved specialist answer into store changes (applied with the owner's click, then autosaved). */
import { uid } from "../ai";
import { newExperiment, conflict } from "../experiments";
import type { EmailFlowKind, ExperimentKind, Store } from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const applyProductCopy = (productId: string, o: any) => (s: Store): Store => ({
  ...s,
  products: s.products.map((p) => (p.id === productId ? { ...p, title: o.title || p.title, description: o.description || p.description, bullets: o.bullets, seoTitle: o.seoTitle || p.seoTitle, metaDescription: o.metaDescription } : p)),
});

export const applyPrice = (productId: string, cents: number) => (s: Store): Store => ({ ...s, products: s.products.map((p) => (p.id === productId ? { ...p, priceCents: cents } : p)) });

export function startTest(kind: ExperimentKind, bValue: string, productId: string | null, hypothesis: string) {
  return (s: Store): Store => {
    if (conflict(s, kind, productId ?? undefined)) return s;
    const b = kind === "headline" ? bValue : kind === "popup_offer" ? Math.round(Number(bValue)) : Math.round(Number(bValue) * 100);
    const exp = newExperiment(s, kind, b, { productId: productId ?? undefined, name: hypothesis.length < 70 ? hypothesis : undefined });
    return { ...s, experiments: [exp, ...s.experiments] };
  };
}

export const applyEmail = (kind: EmailFlowKind, o: any) => (s: Store): Store => ({
  ...s,
  flows: s.flows.map((f) => (f.kind === kind ? { ...f, subject: o.subject, body: o.preheader ? `${o.body}` : o.body } : f)),
});

export const applySeo = (items: { productId: string; seoTitle: string; metaDescription: string }[]) => (s: Store): Store => ({
  ...s,
  products: s.products.map((p) => {
    const x = items.find((i) => i.productId === p.id);
    return x ? { ...p, seoTitle: x.seoTitle, metaDescription: x.metaDescription } : p;
  }),
});

export const addLesson = (text: string, source: "owner" | "result" | "ai") => (s: Store): Store => ({
  ...s,
  lessons: [{ id: uid(), text: text.trim().slice(0, 400), source, createdAt: new Date().toISOString() }, ...s.lessons].slice(0, 100),
});

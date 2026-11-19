import type { Category, Section, SectionType, Store } from "./types";

export const SECTION_LABEL: Record<SectionType, string> = {
  hero: "Hero banner",
  collection: "Product grid",
  trust: "Shipping & returns strip",
  story: "Brand story",
  reviews: "Customer reviews",
  faq: "Questions",
  newsletter: "Email sign-up",
};

export const DEFAULT_SECTIONS: Section[] = [
  { id: "hero", enabled: true },
  { id: "collection", enabled: true },
  { id: "trust", enabled: true },
  { id: "story", enabled: true },
  { id: "reviews", enabled: true },
  { id: "faq", enabled: false },
  { id: "newsletter", enabled: true },
];

const STORIES: Record<Category, string> = {
  homeware: "Every piece is made in small runs by people who care how it feels in the hand. We'd rather make fewer things that last than more things that don't.",
  skincare: "We started with one question: what does skin actually need? The answer was shorter than the average routine. So that's what we make.",
  clothing: "We make the clothes we wanted and couldn't find: heavier fabrics, better seams, colours that go with everything. Nothing seasonal, nothing disposable.",
  coffee: "We roast in small batches every week and ship within days, so the coffee you open still tastes like the coffee we cupped.",
  jewelry: "Each piece is made from recycled metals and finished by hand. Designed to be worn every day, not saved for best.",
  pet: "Made by dog people, tested by actual dogs. If it doesn't survive our own pack, it doesn't make the shop.",
  general: "We're a small team making a short list of things we're proud of. Every order is packed by hand.",
};

type Defaulted = "experiments" | "announcement" | "sections" | "story" | "faqs" | "subscribers";
export type StoreInput = Omit<Store, Defaulted> & Partial<Pick<Store, Defaulted>>;

/** Fill in fields added after a store was first saved (and give new stores their defaults). */
export function withDefaults(s: StoreInput): Store {
  const p = s;
  return {
    ...s,
    experiments: p.experiments ?? [],
    announcement: p.announcement ?? `Free shipping on orders over $${Math.round(s.freeShippingCents / 100)}`,
    sections: p.sections ?? DEFAULT_SECTIONS,
    story: p.story ?? { title: "Why we started", body: STORIES[s.category] },
    faqs: p.faqs ?? [
      { q: "When will my order ship?", a: "Most orders leave within 1–2 business days. You'll get a tracking link by email." },
      { q: "Can I return something?", a: "Yes. Unused items can be returned within 30 days for a full refund." },
      { q: "Do you ship internationally?", a: "We ship to most countries. Rates are shown at checkout." },
    ],
    subscribers: p.subscribers ?? [],
  };
}

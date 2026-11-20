export type Category =
  | "homeware"
  | "skincare"
  | "clothing"
  | "coffee"
  | "jewelry"
  | "pet"
  | "general";

export type Palette = {
  accent: string; // buttons, highlights
  onAccent: string; // text on accent
  bg: string; // page background
  soft: string; // section / card background
  text: string; // body text
};

export type Apps = {
  reviews: boolean;
  popup: boolean;
  email: boolean;
  loyalty: boolean;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  compareAtCents?: number;
  variants: string[];
  stock: number;
  status: "active" | "draft";
  seoTitle: string;
  art: number; // seed for generated artwork
  /** uploaded product photo (media id); shown instead of the artwork */
  image?: string;
  /** short facts shown under the description */
  bullets?: string[];
  /** search-result description (SEO) */
  metaDescription?: string;
};

export type Review = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  body: string;
};

export type OrderItem = {
  productId: string;
  title: string;
  variant?: string;
  qty: number;
  unitCents: number;
};

export type Customer = {
  name: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  country: string;
};

export type OrderStatus = "paid" | "fulfilled" | "refunded";

export type Order = {
  id: string;
  number: number;
  customer: Customer;
  items: OrderItem[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  status: OrderStatus;
  createdAt: string;
  pointsEarned: number;
  paymentMethod: string;
};

export type EmailFlowKind =
  | "welcome"
  | "abandoned_checkout"
  | "post_purchase"
  | "review_request";

export type EmailFlow = {
  kind: EmailFlowKind;
  enabled: boolean;
  delayMinutes: number;
  subject: string;
  body: string;
};

export type ExperimentKind = "headline" | "price" | "free_shipping" | "popup_offer";

export type VariantId = "a" | "b";

export type Variant = {
  id: VariantId;
  /** headline: string; price / free_shipping: cents; popup_offer: percent */
  value: string | number;
  views: number;
  conversions: number;
  revenueCents: number;
  simulatedViews: number;
};

export type Experiment = {
  id: string;
  name: string;
  kind: ExperimentKind;
  productId?: string;
  status: "running" | "paused" | "completed";
  autoPromote: boolean;
  minSample: number;
  winner?: VariantId | "none";
  variants: [Variant, Variant];
  createdAt: string;
  endedAt?: string;
};

/** Something the AI team should remember about this store. */
export type Lesson = {
  id: string;
  text: string;
  /** owner = a fact the owner told us; result = learned from an A/B test or sales; ai = saved from an AI suggestion */
  source: "owner" | "result" | "ai";
  createdAt: string;
};

export type SectionType = "hero" | "collection" | "trust" | "story" | "reviews" | "faq" | "newsletter";
export type Section = { id: SectionType; enabled: boolean };

export type Store = {
  slug: string;
  name: string;
  tagline: string;
  prompt: string;
  category: Category;
  palette: Palette;
  font: "serif" | "sans";
  heroHeadline: string;
  heroSub: string;
  apps: Apps;
  popup: { headline: string; body: string; code: string; percent: number };
  discounts: { code: string; percent: number }[];
  freeShippingCents: number;
  shippingCents: number;
  products: Product[];
  reviews: Review[];
  orders: Order[];
  flows: EmailFlow[];
  loyalty: Record<string, number>;
  experiments: Experiment[];
  /** top bar text; empty hides it */
  announcement: string;
  sections: Section[];
  story: { title: string; body: string };
  faqs: { q: string; a: string }[];
  subscribers: string[];
  lessons: Lesson[];
  published: boolean;
  createdAt: string;
};

export type CartLine = { productId: string; variant?: string; qty: number };

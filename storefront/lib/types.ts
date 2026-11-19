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
  published: boolean;
  createdAt: string;
};

export type CartLine = { productId: string; variant?: string; qty: number };

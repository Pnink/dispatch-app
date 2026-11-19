/**
 * Building a store around the owner's own product photos without an AI model (free path).
 * Each photo becomes a product; names and prices come from the owner's notes when they're there.
 * With an AI model selected, applyGenerated() in ai-actions.ts does this job instead (it can see the photos).
 */
import { uid } from "./ai";
import type { Store } from "./types";

export type PhotoInput = { id: string; name: string };

const prettify = (file: string) =>
  file
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^(img|dsc|pxl|photo|image)[-_ ]?\d*[-_ ]?/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\d{6,}\b/g, "")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** "Linen apron - $38", "Linen apron: 38", "Linen apron 38.00" -> { title, price } */
export function parseLine(line: string): { title: string; priceCents?: number } {
  const m = line.match(/(?:[-–:,]\s*)?\$?\s*(\d{1,5}(?:[.,]\d{1,2})?)\s*(?:usd|dollars)?\s*$/i);
  const priceCents = m ? Math.round(parseFloat(m[1].replace(",", ".")) * 100) : undefined;
  const title = (m ? line.slice(0, m.index) : line).replace(/[-–:,\s]+$/, "").trim();
  return { title, priceCents: priceCents && priceCents >= 100 ? priceCents : undefined };
}

export function buildFromPhotos(base: Store, photos: PhotoInput[], notes: string, accent?: string): Store {
  if (!photos.length) return base;
  const lines = notes
    .split(/\n|;/)
    .map((l) => l.trim())
    .filter((l) => l && l.length <= 120);
  // Lines with a price are products (in photo order). A first line without a price names the shop:
  // "Juniper Candle Co — hand-poured soy candles" -> "Juniper Candle Co".
  const priced = lines.filter((l) => parseLine(l).priceCents);
  const productLines = priced.length ? priced : lines.length > photos.length ? lines.slice(1) : lines;
  const first = lines[0] && !parseLine(lines[0]).priceCents ? lines[0] : "";
  const brand = first.split(/\s[—–-]\s|:|,/)[0].trim();
  const hasBrand = brand.length >= 2 && brand.length <= 40 && (priced.length > 0 || lines.length > photos.length);
  const name = hasBrand ? brand : base.name;
  // what the shop sells, from the first line: "Juniper Candle Co — hand-poured soy candles" -> "Hand-poured soy candles"
  const rest = hasBrand ? first.slice(brand.length).replace(/^\s*[—–:,-]\s*/, "").trim() : "";
  const about = rest ? rest.charAt(0).toUpperCase() + rest.slice(1).replace(/\.$/, "") : "";
  const shipping = `Free shipping on orders over $${Math.round(base.freeShippingCents / 100)}.`;
  const products = photos.map((ph, i) => {
    const b = base.products[i % base.products.length];
    const parsed = productLines[i] ? parseLine(productLines[i]) : { title: "" };
    const title = (parsed.title || prettify(ph.name) || `Product ${i + 1}`).slice(0, 80);
    return {
      ...b,
      id: i < base.products.length ? b.id : uid(),
      title,
      priceCents: parsed.priceCents ?? b.priceCents,
      compareAtCents: undefined,
      // never reuse template copy for a real product: say only what the owner told us
      description: about ? `${title}. ${about}.` : `${title}.`,
      variants: [],
      seoTitle: `${title} | ${name}`.slice(0, 70),
      image: ph.id,
    };
  });
  const keep = new Set(products.map((p) => p.id));
  return {
    ...base,
    name,
    heroSub: about ? `${about}. ${shipping}` : `A small collection from ${name}. ${shipping}`,
    tagline: about || base.tagline,
    flows: base.flows.map((f) => ({ ...f, subject: f.subject.replace(base.name, name) })),
    palette: accent ? { ...base.palette, accent, onAccent: "#ffffff" } : base.palette,
    products,
    reviews: base.reviews.filter((r) => keep.has(r.productId)),
  };
}

"use client";
import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Check, Minus, Plus } from "lucide-react";
import { addToCart, submitReview, useShopperStore } from "@/lib/store";
import { money, cx } from "@/lib/format";
import { ProductArt } from "@/components/ProductArt";
import { ProductCard, Stars, avgRating, headingFont } from "@/components/storefront";

export default function ProductPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const store = useShopperStore(slug);
  const product = store?.products.find((p) => p.id === id);
  const [variant, setVariant] = useState<string | undefined>(product?.variants[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!store) return null;
  const base = `/store/${store.slug}`;
  if (!product || product.status !== "active")
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className={cx("text-3xl", headingFont(store))}>We couldn&apos;t find that product</h1>
        <Link href={base} className="mt-6 inline-block underline">Back to the shop</Link>
      </div>
    );

  const rating = store.apps.reviews ? avgRating(store, product.id) : null;
  const reviews = store.reviews.filter((r) => r.productId === product.id);
  const soldOut = product.stock === 0;
  const others = store.products.filter((p) => p.id !== product.id && p.status === "active").slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="text-xs opacity-60" aria-label="Breadcrumb"><Link href={base} className="hover:underline">Home</Link> / {product.title}</nav>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="grid gap-3">
          <ProductArt seed={product.art} title={product.title} category={store.category} accent={store.palette.accent} soft={store.palette.soft} className="aspect-square w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            {[11, 23, 37].map((n) => (
              <ProductArt key={n} seed={product.art + n} title={`${product.title} detail`} category={store.category} accent={store.palette.accent} soft={store.palette.soft} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div>
          <h1 className={cx("text-3xl sm:text-4xl", headingFont(store))}>{product.title}</h1>
          {rating && (
            <a href="#product-reviews" className="mt-2 flex items-center gap-2 text-sm opacity-80"><Stars rating={rating.avg} /> {rating.avg.toFixed(1)} ({rating.count} reviews)</a>
          )}
          <div className="mt-4 flex items-baseline gap-3 text-2xl">
            {money(product.priceCents)}
            {product.compareAtCents && <span className="text-base line-through opacity-50">{money(product.compareAtCents)}</span>}
          </div>
          <p className="mt-6 leading-relaxed opacity-80">{product.description}</p>

          {product.variants.length > 0 && (
            <fieldset className="mt-6">
              <legend className="text-sm font-medium">Option</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={variant === v}
                    onClick={() => setVariant(v)}
                    className={cx("rounded-md border px-4 py-2 text-sm", variant === v ? "border-[var(--s-accent)] bg-[var(--s-accent)] text-[var(--s-on-accent)]" : "border-[color-mix(in_srgb,var(--s-text)_25%,transparent)]")}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-12 items-center rounded-md border border-[color-mix(in_srgb,var(--s-text)_25%,transparent)]">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity" className="px-3"><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center tabular-nums" aria-live="polite">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} aria-label="Increase quantity" className="px-3"><Plus className="h-4 w-4" /></button>
            </div>
            <button
              disabled={soldOut}
              onClick={() => {
                addToCart(store.slug, product.id, variant, qty);
                setAdded(true);
                setTimeout(() => setAdded(false), 2000);
              }}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-[var(--s-accent)] font-medium text-[var(--s-on-accent)] hover:opacity-90 disabled:opacity-40"
            >
              {soldOut ? "Sold out" : added ? <><Check className="h-4 w-4" /> Added to cart</> : "Add to cart"}
            </button>
          </div>
          {added && <Link href={`${base}/cart`} className="mt-3 inline-block text-sm underline">View cart & check out →</Link>}
          <p className="mt-4 text-xs opacity-60">{soldOut ? "Out of stock" : product.stock < 10 ? `Only ${product.stock} left` : "In stock, ships in 1–2 business days"}</p>
        </div>
      </div>

      {store.apps.reviews && (
        <section id="product-reviews" className="mt-20 scroll-mt-4">
          <h2 className={cx("text-2xl", headingFont(store))}>Reviews</h2>
          {reviews.length === 0 && <p className="mt-4 text-sm opacity-70">No reviews yet — be the first.</p>}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <figure key={r.id} className="rounded-lg bg-[var(--s-soft)] p-5">
                <Stars rating={r.rating} />
                <blockquote className="mt-2 text-sm">{r.body}</blockquote>
                <figcaption className="mt-2 text-xs opacity-60">{r.author}</figcaption>
              </figure>
            ))}
          </div>
          <ReviewForm onSubmit={(author, rating, body) => submitReview(store.slug, { productId: product.id, author, rating, body })} />
        </section>
      )}

      {others.length > 0 && (
        <section className="mt-20">
          <h2 className={cx("text-2xl", headingFont(store))}>You might also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {others.map((p) => <ProductCard key={p.id} store={store} product={p} base={base} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewForm({ onSubmit }: { onSubmit: (author: string, rating: number, body: string) => Promise<string | null> }) {
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [thanks, setThanks] = useState(false);
  const input = "w-full rounded-md border border-[color-mix(in_srgb,var(--s-text)_25%,transparent)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--s-accent)]";

  if (thanks) return <p className="mt-6 text-sm" role="status">Thanks for your review!</p>;
  if (!open) return <button onClick={() => setOpen(true)} className="mt-6 rounded-md border border-[color-mix(in_srgb,var(--s-text)_25%,transparent)] px-4 py-2 text-sm">Write a review</button>;
  return (
    <form
      className="mt-6 max-w-lg space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || body.trim().length < 5) return;
        onSubmit(name.trim(), rating, body.trim()).then((error) => (error ? setErr(error) : setThanks(true)));
      }}
    >
      <fieldset>
        <legend className="text-sm font-medium">Your rating</legend>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`} aria-pressed={rating === n} className={cx("text-2xl", n <= rating ? "" : "opacity-30")}>★</button>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm">Name<input required value={name} onChange={(e) => setName(e.target.value)} className={cx(input, "mt-1")} /></label>
      <label className="block text-sm">Review<textarea required minLength={5} rows={3} value={body} onChange={(e) => setBody(e.target.value)} className={cx(input, "mt-1")} /></label>
      {err && <p className="text-xs text-red-600" role="alert">{err}</p>}
      <button type="submit" className="rounded-md bg-[var(--s-accent)] px-4 py-2 text-sm font-medium text-[var(--s-on-accent)]">Post review</button>
    </form>
  );
}

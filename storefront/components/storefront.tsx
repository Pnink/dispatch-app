import Link from "next/link";
import { ShoppingBag, Star, Truck } from "lucide-react";
import type { Product, Store } from "@/lib/types";
import { money, cx } from "@/lib/format";
import { ProductArt } from "./ProductArt";

/** Per-store theme: palette becomes CSS variables used via arbitrary Tailwind values. */
export function StoreTheme({ store, children, className = "" }: { store: Store; children: React.ReactNode; className?: string }) {
  const p = store.palette;
  return (
    <div
      className={cx("min-h-full bg-[var(--s-bg)] text-[var(--s-text)]", className)}
      style={
        {
          "--s-accent": p.accent,
          "--s-on-accent": p.onAccent,
          "--s-bg": p.bg,
          "--s-soft": p.soft,
          "--s-text": p.text,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

export const headingFont = (s: Store) => (s.font === "serif" ? "font-display" : "font-sans font-semibold tracking-tight");

export function StoreHeader({ store, cartCount = 0, base }: { store: Store; cartCount?: number; base: string }) {
  return (
    <header className="border-b border-[color-mix(in_srgb,var(--s-text)_12%,transparent)]">
      {store.freeShippingCents > 0 && (
        <div className="bg-[var(--s-accent)] py-1.5 text-center text-xs text-[var(--s-on-accent)]">
          Free shipping on orders over {money(store.freeShippingCents)}
        </div>
      )}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={base} className={cx("text-xl", headingFont(store))}>{store.name}</Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href={`${base}#shop`} className="hidden opacity-80 hover:opacity-100 sm:inline">Shop</Link>
          <Link href={`${base}#reviews`} className="hidden opacity-80 hover:opacity-100 sm:inline">Reviews</Link>
          <Link href={`${base}/cart`} className="relative flex items-center gap-1.5" aria-label={`Cart, ${cartCount} items`}>
            <ShoppingBag className="h-5 w-5" aria-hidden />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--s-accent)] px-1 text-[10px] font-semibold text-[var(--s-on-accent)]">{cartCount}</span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Stars({ rating, className = "h-3.5 w-3.5" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cx(className, i <= Math.round(rating) ? "fill-current" : "opacity-30")} aria-hidden />
      ))}
    </span>
  );
}

export function avgRating(store: Store, productId?: string) {
  const rs = store.reviews.filter((r) => !productId || r.productId === productId);
  return rs.length ? { avg: rs.reduce((a, r) => a + r.rating, 0) / rs.length, count: rs.length } : null;
}

export function ProductCard({ store, product, base }: { store: Store; product: Product; base: string }) {
  const rating = store.apps.reviews ? avgRating(store, product.id) : null;
  return (
    <Link href={`${base}/p/${product.id}`} className="group block">
      <div className="overflow-hidden rounded-lg">
        <ProductArt seed={product.art} title={product.title} category={store.category} accent={store.palette.accent} soft={store.palette.soft} className="aspect-[4/5] w-full transition-transform duration-300 group-hover:scale-[1.03]" />
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">{product.title}</h3>
          {rating && (
            <div className="mt-1 flex items-center gap-1 text-xs opacity-70">
              <Stars rating={rating.avg} className="h-3 w-3" /> ({rating.count})
            </div>
          )}
        </div>
        <div className="text-right text-sm">
          <div>{money(product.priceCents)}</div>
          {product.compareAtCents && <div className="text-xs line-through opacity-50">{money(product.compareAtCents)}</div>}
        </div>
      </div>
      {product.stock === 0 && <div className="mt-1 text-xs opacity-60">Sold out</div>}
    </Link>
  );
}

export function StoreHome({ store, base }: { store: Store; base: string }) {
  const products = store.products.filter((p) => p.status === "active");
  const featured = products[0];
  return (
    <>
      <section className="bg-[var(--s-soft)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <h1 className={cx("text-4xl leading-tight sm:text-5xl", headingFont(store))}>{store.heroHeadline}</h1>
            <p className="mt-4 max-w-md opacity-75">{store.heroSub}</p>
            <Link href={`${base}#shop`} className="mt-8 inline-flex h-12 items-center rounded-md bg-[var(--s-accent)] px-6 font-medium text-[var(--s-on-accent)] hover:opacity-90">
              Shop the collection
            </Link>
          </div>
          {featured && (
            <ProductArt seed={featured.art + 7} title={featured.title} category={store.category} accent={store.palette.accent} soft={store.palette.bg} className="aspect-square w-full rounded-2xl" />
          )}
        </div>
      </section>

      <section id="shop" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-16 sm:px-6">
        <h2 className={cx("text-2xl", headingFont(store))}>The collection</h2>
        {products.length === 0 ? (
          <p className="mt-6 opacity-70">New products are on the way. Check back soon.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} store={store} product={p} base={base} />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-[color-mix(in_srgb,var(--s-text)_10%,transparent)]">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-3 sm:px-6">
          <div className="flex items-center gap-3"><Truck className="h-5 w-5 opacity-70" aria-hidden /> Free shipping over {money(store.freeShippingCents)}</div>
          <div className="flex items-center gap-3"><ShoppingBag className="h-5 w-5 opacity-70" aria-hidden /> 30-day easy returns</div>
          <div className="flex items-center gap-3"><Star className="h-5 w-5 opacity-70" aria-hidden /> Loved by our customers</div>
        </div>
      </section>

      {store.apps.reviews && store.reviews.length > 0 && (
        <section id="reviews" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between">
            <h2 className={cx("text-2xl", headingFont(store))}>What customers say</h2>
            {avgRating(store) && (
              <div className="flex items-center gap-2 text-sm">
                <Stars rating={avgRating(store)!.avg} /> {avgRating(store)!.avg.toFixed(1)} · {store.reviews.length} reviews
              </div>
            )}
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {store.reviews.slice(0, 3).map((r) => (
              <figure key={r.id} className="rounded-lg bg-[var(--s-soft)] p-5">
                <Stars rating={r.rating} />
                <blockquote className="mt-3 text-sm">{r.body}</blockquote>
                <figcaption className="mt-3 text-xs opacity-60">
                  {r.author} · {store.products.find((p) => p.id === r.productId)?.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export function StoreFooter({ store }: { store: Store }) {
  return (
    <footer className="mt-10 border-t border-[color-mix(in_srgb,var(--s-text)_12%,transparent)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs opacity-70 sm:flex-row sm:justify-between sm:px-6">
        <span>© 2026 {store.name}</span>
        <span>Powered by Forgecart (demo)</span>
      </div>
    </footer>
  );
}

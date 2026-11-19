import Link from "next/link";
import { BarChart3, Bot, Check, FlaskConical, Image as ImageIcon, LayoutDashboard, Mail, Package, Search, Settings, ShoppingBag, Star } from "lucide-react";
import { LinkButton } from "@/components/ui";
import { PromptBox } from "@/components/PromptBox";
import { ProductArt } from "@/components/ProductArt";
import type { Category } from "@/lib/types";

const METHODS = ["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay", "PayPal", "Klarna", "iDEAL", "SEPA", "Bancontact", "Alipay", "Afterpay"];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-[radial-gradient(ellipse_at_center,var(--color-accent-soft),transparent_70%)]" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Personal demo build · everything runs in your browser
          </p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-7xl">Launch a brand.<br />Let agents run the shop.</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
            Describe what you want to sell. Forgecart designs the storefront, writes the products, and then keeps working beside you — orders, email, offers and all.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/create" size="lg">Start building — free</LinkButton>
            <LinkButton href="/faq#contact" size="lg" variant="secondary">Talk to us</LinkButton>
          </div>
        </div>
      </section>

      {/* Payment method marquee */}
      <section className="border-y border-border bg-surface py-6" aria-label="Payment methods supported">
        <p className="mb-4 text-center text-xs uppercase tracking-widest text-muted">Checkout that takes the way your customers pay</p>
        <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
          <div className="flex w-max animate-marquee gap-10">
            {[...METHODS, ...METHODS].map((m, i) => (
              <span key={i} className="text-lg font-semibold text-muted/70" aria-hidden={i >= METHODS.length}>{m}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-16 sm:grid-cols-3 sm:px-6">
        {[
          ["~60 sec", "from a sentence to a working storefront"],
          ["0 plugins", "reviews, popups, email and loyalty come built in"],
          ["Always on", "an assistant that can act, not just answer"],
        ].map(([big, small]) => (
          <div key={big} className="rounded-lg border border-border p-6 text-center">
            <div className="font-display text-4xl">{big}</div>
            <div className="mt-2 text-sm text-muted">{small}</div>
          </div>
        ))}
      </section>

      {/* Tagline + one platform */}
      <section className="bg-ink py-20 text-on-ink">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center font-display text-4xl sm:text-5xl">Skip the app store. Skip the agency.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-on-ink/70">
            Storefront, catalog, imagery, email, experiments and reporting share one admin and one source of truth — with an assistant that sees what you see.
          </p>
          <AdminMock />
        </div>
      </section>

      {/* Feature blocks */}
      <div className="mx-auto max-w-6xl space-y-24 px-4 py-24 sm:px-6">
        <Feature id="design" icon={<LayoutDashboard className="h-4 w-4" />} kicker="Store design" title="Say what you're selling. Get a whole store." body="A name, a palette, a homepage, product pages, cart and checkout — generated together so they actually match. Change anything later by asking." visual={<StoreMock />} />
        <Feature id="email" flip icon={<Mail className="h-4 w-4" />} kicker="Email" title="Flows that write and send themselves" body="Welcome, abandoned checkout, post-purchase and review requests are drafted in your brand voice and switched on from day one." visual={<EmailMock />} />
        <Feature id="search" icon={<Search className="h-4 w-4" />} kicker="Search visibility" title="Easy to find — on search engines and in AI answers" body="Clean server-rendered pages, structured data, sensible titles and alt text for every product, kept up to date as your catalog changes." visual={<SearchMock />} />
        <Feature id="photos" flip icon={<ImageIcon className="h-4 w-4" />} kicker="Product imagery" title="A consistent look across every product" body="Generate a matching set of product shots in your brand palette, or upload your own and let the assistant tidy them up." visual={<PhotoGrid />} />
        <Feature id="testing" icon={<FlaskConical className="h-4 w-4" />} kicker="Experiments" title="Two versions in. The better one stays." body="Ask for a test on a headline, price anchor or shipping threshold. Traffic is split, results are watched, and the winner is rolled out for you." visual={<AbMock />} />
      </div>

      {/* Closing prompt */}
      <section className="bg-ink py-24 text-on-ink">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="font-display text-4xl sm:text-5xl">What will you open?</h2>
          <p className="mt-3 text-on-ink/70">One sentence is enough to get started.</p>
          <div className="mt-8 text-text">
            <PromptBox dark />
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({ id, icon, kicker, title, body, visual, flip }: { id: string; icon: React.ReactNode; kicker: string; title: string; body: string; visual: React.ReactNode; flip?: boolean }) {
  return (
    <section id={id} className="grid scroll-mt-24 items-center gap-10 md:grid-cols-2">
      <div className={flip ? "md:order-2" : ""}>
        <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">{icon}{kicker}</div>
        <h3 className="mt-4 font-display text-3xl sm:text-4xl">{title}</h3>
        <p className="mt-4 text-muted">{body}</p>
        <Link href="/create" className="mt-6 inline-block text-sm font-medium text-accent hover:underline">Try it now →</Link>
      </div>
      <div className={flip ? "md:order-1" : ""}>{visual}</div>
    </section>
  );
}

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`overflow-hidden rounded-xl border border-border bg-bg shadow-pop ${className}`}>{children}</div>;
}

function AdminMock() {
  const icons = [LayoutDashboard, ShoppingBag, Package, Mail, BarChart3, Settings];
  return (
    <div className="mt-12 overflow-hidden rounded-xl border border-white/10 bg-bg text-text shadow-2xl" aria-label="Illustration of the admin">
      <div className="flex h-[380px]">
        <div className="flex w-12 flex-col items-center gap-4 border-r border-border bg-surface py-4">
          {icons.map((I, i) => <I key={i} className={`h-4 w-4 ${i === 1 ? "text-accent" : "text-muted"}`} aria-hidden />)}
        </div>
        <div className="hidden w-72 flex-col border-r border-border p-4 sm:flex">
          <div className="flex items-center gap-2 text-sm font-medium"><Bot className="h-4 w-4 text-accent" /> Assistant</div>
          <div className="mt-4 space-y-3 text-xs">
            <div className="ml-auto w-fit rounded-lg bg-ink px-3 py-2 text-on-ink">Anything need my attention today?</div>
            <div className="rounded-lg bg-surface px-3 py-2">3 orders are waiting to ship and the linen throw is down to 6 units. Want me to restock it to 50?</div>
            <div className="flex gap-2"><span className="rounded-md bg-accent px-2 py-1 text-on-accent">Restock to 50</span><span className="rounded-md border border-border px-2 py-1">Not now</span></div>
          </div>
        </div>
        <div className="flex-1 p-5">
          <div className="text-sm font-semibold">Orders</div>
          <table className="mt-3 w-full text-left text-xs">
            <thead className="text-muted"><tr><th className="py-2 font-normal">Order</th><th className="font-normal">Customer</th><th className="font-normal">Total</th><th className="font-normal">Status</th></tr></thead>
            <tbody>
              {[["#1042", "R. Alvarez", "$128.00", "Unfulfilled"], ["#1041", "K. Osei", "$64.00", "Fulfilled"], ["#1040", "J. Park", "$212.50", "Unfulfilled"], ["#1039", "A. Novak", "$39.00", "Fulfilled"], ["#1038", "S. Haddad", "$88.00", "Refunded"]].map((r) => (
                <tr key={r[0]} className="border-t border-border">
                  <td className="py-2.5 font-medium">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td>
                  <td><span className={`rounded-full px-2 py-0.5 ${r[3] === "Fulfilled" ? "bg-success/10 text-success" : r[3] === "Refunded" ? "bg-surface text-muted" : "bg-amber-100 text-amber-800"}`}>{r[3]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StoreMock() {
  const items: [string, Category][] = [["Stoneware Vase", "homeware"], ["Linen Throw", "homeware"], ["Pillar Candle", "homeware"]];
  return (
    <Frame>
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-border" /><span className="h-2.5 w-2.5 rounded-full bg-border" /><span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="ml-3 rounded bg-surface px-2 py-0.5 text-[10px] text-muted">hearth-and-clay.forgecart.demo</span>
      </div>
      <div className="bg-[#fbf8f3] p-5 text-[#2b2118]">
        <div className="flex justify-between text-xs"><span className="font-display text-base">Hearth & Clay</span><span>Shop · About · Cart (0)</span></div>
        <div className="mt-6 font-display text-2xl">Quiet pieces, made to last</div>
        <div className="mt-1 text-xs opacity-70">Handmade ceramics and linen for slower days.</div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {items.map(([t, c], i) => (
            <div key={t}>
              <ProductArt seed={i * 137} title={t} category={c} accent="#7c4a2d" soft="#f1e9dd" className="aspect-square w-full rounded" />
              <div className="mt-1 text-[11px]">{t}</div>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

function EmailMock() {
  return (
    <Frame className="p-5">
      <div className="flex items-center gap-2 text-xs text-muted"><span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">Trigger</span> Checkout started, not completed <span className="ml-auto">wait 1 hour</span></div>
      <div className="mt-4 rounded-lg border border-border p-4">
        <div className="text-xs text-muted">Subject</div>
        <div className="font-medium">Still thinking it over?</div>
        <div className="mt-3 flex gap-3">
          <ProductArt seed={42} title="Washed Linen Throw" category="homeware" accent="#3f5f4a" soft="#e7ebe2" className="h-20 w-20 rounded" />
          <div className="text-sm text-muted">Your Washed Linen Throw is saved in your cart. We'll hold it for 24 hours — and shipping's on us over $75.</div>
        </div>
        <div className="mt-4 w-fit rounded-md bg-ink px-3 py-1.5 text-xs text-on-ink">Return to cart</div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        {[["Sent", "1,284"], ["Opened", "52%"], ["Recovered", "$3,410"]].map(([a, b]) => <div key={a} className="rounded-md bg-surface p-2"><div className="text-muted">{a}</div><div className="font-semibold">{b}</div></div>)}
      </div>
    </Frame>
  );
}

function SearchMock() {
  return (
    <Frame className="p-5">
      <div className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><Search className="h-4 w-4 text-muted" /> best handmade ceramic vase</div>
      <div className="mt-4 space-y-4">
        {[
          ["hearth-and-clay.com › vases", "Hand-thrown Stoneware Vase | Hearth & Clay", "Wheel-thrown in small batches with a speckled matte glaze. ★★★★★ 4.9 · In stock · $64", true],
          ["example-marketplace.com › ...", "Ceramic Vases — 2,000+ results", "Shop mass-produced vases from hundreds of sellers…", false],
          ["example-blog.com › guides", "How to choose a vase for dried flowers", "A short guide to shapes and finishes…", false],
        ].map(([u, t, d, us]) => (
          <div key={t as string} className={us ? "rounded-lg bg-accent-soft p-3" : "px-3"}>
            <div className="text-xs text-muted">{u}</div>
            <div className="text-sm font-medium text-accent">{t}</div>
            <div className="text-xs text-muted">{d}</div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function PhotoGrid() {
  const items: [string, Category, string, string][] = [
    ["Serum", "skincare", "#9d4b5f", "#f8e8e4"], ["Tee", "clothing", "#1e3a5f", "#ebeee9"], ["Beans", "coffee", "#8a3b12", "#f2e6d8"], ["Ring", "jewelry", "#6b5a2e", "#f2eee1"], ["Vase", "homeware", "#3f5f4a", "#e7ebe2"],
    ["Cream", "skincare", "#2f6f73", "#e2efee"], ["Hoodie", "clothing", "#111827", "#f3f4f6"], ["Dripper", "coffee", "#14532d", "#e9ecdf"], ["Necklace", "jewelry", "#3b2f5e", "#ebe8f3"], ["Candle", "homeware", "#7c4a2d", "#f1e9dd"],
  ];
  return (
    <div className="grid grid-cols-5 gap-2">
      {items.map(([t, c, a, s], i) => <ProductArt key={t} seed={i * 97} title={t} category={c} accent={a} soft={s} className="aspect-square w-full rounded-lg" />)}
    </div>
  );
}

function AbMock() {
  return (
    <Frame className="p-5">
      <div className="flex items-center justify-between text-sm"><span className="font-medium">Homepage headline</span><span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">Winner found · day 4</span></div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[["A · control", "Objects for slower days", "2.1%", false], ["B · variant", "Handmade for the rooms you live in", "2.9%", true]].map(([k, h, cr, win]) => (
          <div key={k as string} className={`rounded-lg border p-3 ${win ? "border-success" : "border-border"}`}>
            <div className="text-xs text-muted">{k}</div>
            <div className="mt-1 text-sm font-medium">"{h}"</div>
            <div className="mt-3 text-2xl font-semibold">{cr}</div>
            <div className="text-xs text-muted">conversion</div>
            {win && <div className="mt-2 flex items-center gap-1 text-xs text-success"><Check className="h-3 w-3" /> Rolled out to 100%</div>}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs text-muted"><Star className="h-3 w-3" /> 97% probability B is better</div>
    </Frame>
  );
}

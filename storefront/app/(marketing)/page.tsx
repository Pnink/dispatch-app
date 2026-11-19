import Link from "next/link";
import { AlertCircle, ArrowRight, Blocks, Bot, Check, Database, EyeOff, FlaskConical, Keyboard, LayoutList, Lightbulb, Sparkles } from "lucide-react";
import { PromptBox } from "@/components/PromptBox";
import { ProductArt } from "@/components/ProductArt";
import type { Category } from "@/lib/types";

export default function Home() {
  return (
    <>
      {/* Hero: split, prompt box inline */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-accent-soft blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1 text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Built for your desktop · saves as you go · $0 a month
            </p>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] sm:text-7xl">Stop renting your store.</h1>
            <p className="mt-6 max-w-lg text-lg text-muted">
              Your shop&apos;s back office, made for a big screen and a keyboard. Describe what you sell, get a finished storefront in about a minute,
              then run it from a dashboard that tells you what to do next. Every change saves to your own computer the moment you make it.
            </p>
            <div className="mt-8 max-w-xl">
              <PromptBox />
            </div>
          </div>
          <TodayMock />
        </div>
      </section>

      {/* What you don't pay */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border md:grid-cols-4">
          {[
            ["$0", "monthly plan"],
            ["0%", "taken from your sales"],
            ["$0", "for reviews, popups, email, loyalty"],
            ["0", "features locked behind a tier"],
          ].map(([big, small]) => (
            <div key={small} className="bg-surface px-6 py-8">
              <div className="font-display text-4xl text-accent">{big}</div>
              <div className="mt-1 text-sm text-muted">{small}</div>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-6 text-xs text-muted sm:px-6">
          You still pay your card processor, hosting and domain once it&apos;s live. <Link href="/costs" className="underline">See the real numbers →</Link>
        </p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h2 className="font-display text-4xl sm:text-5xl">Sentence in. Shop out.</h2>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            ["Describe it", "One line about what you sell and the feel you want. Add a reference image if you have one."],
            ["Check it", "See the name, palette, products and homepage before anything goes live. Rename, redo, or publish."],
            ["Run it", "Ship orders, test ideas and grow your list from a dashboard that ranks what matters today."],
          ].map(([t, d], i) => (
            <li key={t} className="relative rounded-2xl border border-border bg-bg p-6">
              <span className="font-display text-6xl text-border">{i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Feature bento */}
      <section id="features" className="scroll-mt-20 bg-ink py-24 text-on-ink">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="max-w-2xl font-display text-4xl sm:text-5xl">Everything a store needs. Nothing you rent.</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <Tile className="md:col-span-2" icon={LayoutList} title="A Today list, not a dashboard of charts" body="Orders to ship, stock running out, a test that just found a winner — ranked, with the fix one click away." />
            <Tile icon={Bot} title="An assistant that acts" body="Ask for a discount, a new product, a restyle or a refund. It proposes; you approve." />
            <Tile icon={FlaskConical} title="A/B tests on everything that sells" body="Headlines, prices, shipping thresholds, discounts. The winner rolls out by itself." />
            <Tile icon={Blocks} title="Apps already installed" body="Reviews, email capture, email flows and loyalty points. One switch each." />
            <Tile icon={Database} title="Saved on your computer" body="Every change is written to disk as you work, with automatic backups every few minutes. Export everything as JSON or CSV any time." />
            <Tile className="md:col-span-2" icon={Sparkles} title="A homepage you arrange" body="Reorder and hide sections, edit the announcement bar, brand story and questions — or just describe the change. The preview updates as you type." />
            <Tile icon={Keyboard} title="Made for a keyboard" body="⌘K to jump anywhere, G-then-a-letter to switch pages, ⌘S if you like to save by hand. Press ? for the list." />
          </div>
        </div>
      </section>

      {/* Invisible */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 md:grid-cols-2">
        <StorefrontMock />
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent"><EyeOff className="h-3.5 w-3.5" /> White-label by default</div>
          <h2 className="mt-4 font-display text-4xl">Your customers only ever see you.</h2>
          <ul className="mt-6 space-y-3 text-muted">
            {[
              "Your store name in the browser tab — and your own favicon",
              "No “powered by” line, badge or platform link anywhere",
              "Checkout, emails and order pages in your colours",
              "Your own domain once it's deployed",
            ].map((t) => (
              <li key={t} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Close */}
      <section className="bg-accent py-20 text-on-accent">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="font-display text-4xl sm:text-5xl">What are you going to sell?</h2>
          <p className="mt-3 opacity-80">One sentence is enough.</p>
          <div className="mt-8 text-text">
            <PromptBox dark />
          </div>
        </div>
      </section>
    </>
  );
}

function Tile({ icon: Icon, title, body, className = "" }: { icon: typeof Bot; title: string; body: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.04] p-6 ${className}`}>
      <Icon className="h-5 w-5 text-[#7fd1bb]" aria-hidden />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-on-ink/70">{body}</p>
    </div>
  );
}

function TodayMock() {
  const rows: { icon: typeof Bot; cls: string; t: string; d: string; btn: string }[] = [
    { icon: AlertCircle, cls: "text-buoy", t: "Ship 3 orders", d: "The oldest has waited 2 days.", btn: "Open" },
    { icon: AlertCircle, cls: "text-buoy", t: "Linen throw is sold out", d: "Washed Linen Throw (0)", btn: "Restock to 50" },
    { icon: ArrowRight, cls: "text-accent", t: "“Homepage headline” has a winner", d: "B is ahead with 95%+ confidence.", btn: "Roll out B" },
    { icon: Lightbulb, cls: "text-muted", t: "You have repeat customers", d: "Loyalty points bring them back sooner.", btn: "Turn on" },
  ];
  return (
    <div className="relative" aria-label="Illustration of the Today list">
      <div className="rounded-2xl border border-border bg-bg shadow-pop">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <div className="text-xs text-muted">Tuesday</div>
            <div className="font-display text-xl">Good morning.</div>
          </div>
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">3 to do</span>
        </div>
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.t} className="flex items-center gap-3 px-5 py-3">
              <r.icon className={`h-5 w-5 shrink-0 ${r.cls}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.t}</div>
                <div className="truncate text-xs text-muted">{r.d}</div>
              </div>
              <span className="shrink-0 rounded-md bg-ink px-2.5 py-1 text-[11px] font-medium text-on-ink">{r.btn}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="absolute -bottom-6 -left-4 hidden rounded-xl border border-border bg-bg px-4 py-3 shadow-pop sm:block">
        <div className="text-xs text-muted">This week</div>
        <div className="text-2xl font-semibold tabular-nums">$1,284.50</div>
      </div>
    </div>
  );
}

function StorefrontMock() {
  const items: [string, Category][] = [["Stoneware Vase", "homeware"], ["Linen Throw", "homeware"], ["Pillar Candle", "homeware"]];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-bg shadow-pop" aria-label="Illustration of a white-label storefront">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
        <span className="grid h-4 w-4 place-items-center rounded bg-[#3f5f4a] text-[9px] font-bold text-white">L</span>
        <span className="text-xs">Linden &amp; Clay</span>
        <span className="ml-auto truncate rounded bg-bg px-2 py-0.5 text-[10px] text-muted">lindenandclay.com</span>
      </div>
      <div className="bg-[#f7f7f2] p-5 text-[#1f2a22]">
        <div className="flex justify-between text-xs"><span className="font-serif text-base">Linden &amp; Clay</span><span>Shop · About · Cart (1)</span></div>
        <div className="mt-6 font-serif text-2xl">Quiet pieces, made to last</div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {items.map(([t, c], i) => (
            <div key={t}>
              <ProductArt seed={i * 137} title={t} category={c} accent="#3f5f4a" soft="#e7ebe2" className="aspect-square w-full rounded" />
              <div className="mt-1 text-[11px]">{t}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-black/10 pt-3 text-[10px] opacity-60">© 2026 Linden &amp; Clay</div>
      </div>
    </div>
  );
}

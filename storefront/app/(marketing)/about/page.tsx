import type { Metadata } from "next";
import { Database, EyeOff, LayoutList, Wallet } from "lucide-react";
import { LinkButton } from "@/components/ui";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Why" };

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 pb-16 pt-20 sm:px-6">
        <p className="text-sm font-medium text-accent">Why {BRAND.wordmark} exists</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.05] sm:text-6xl">Rent is for apartments, not storefronts.</h1>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted">
          <p>
            Hosted store builders are good. They&apos;re also a bill that never stops, a feature list split across tiers, and a shop that belongs to
            someone else&apos;s platform. The AI ones are the best yet — and they still charge more for the best AI.
          </p>
          <p>
            This is the other way to do it: the same idea — describe a store, let software do the busywork — built as something you own. Every
            feature on. No cut of your sales. Your data a click away. And a storefront that only ever shows your name.
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-5xl gap-px bg-border sm:grid-cols-2">
          {[
            [Wallet, "Own it", "No subscription. The only bills are the ones any store has: payments, hosting, a domain."],
            [LayoutList, "Tell me what to do", "A ranked Today list beats a wall of charts. Fixes are one click away."],
            [Database, "Leave any time", "Full backups and CSV exports. Lock-in is a business model, not a feature."],
            [EyeOff, "Stay invisible", "Your customers see your brand. Not ours, not anyone's."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Wallet;
            return (
              <div key={t as string} className="bg-surface p-8">
                <I className="h-5 w-5 text-accent" aria-hidden />
                <h2 className="mt-4 text-lg font-semibold">{t as string}</h2>
                <p className="mt-2 text-sm text-muted">{d as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-4xl">Start with one sentence.</h2>
        <div className="mt-8 flex justify-center gap-3">
          <LinkButton href="/create" size="lg" variant="accent">Build a store</LinkButton>
          <LinkButton href="/costs" size="lg" variant="secondary">See the costs</LinkButton>
        </div>
      </section>
    </>
  );
}

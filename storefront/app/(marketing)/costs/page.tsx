import type { Metadata } from "next";
import { CostCalculator } from "./CostCalculator";

export const metadata: Metadata = { title: "Costs" };

export default function CostsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <p className="text-sm font-medium text-accent">No plans. No tiers.</p>
      <h1 className="mt-2 font-display text-5xl sm:text-6xl">What it actually costs to run</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        The software is yours, so it costs nothing. Running a real store still has bills: the card processor, somewhere to host it, a domain.
        Here they are, with nothing hidden — work out your own month below.
      </p>
      <CostCalculator />
      <section className="mt-16 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-bg p-6">
          <h2 className="font-semibold">What&apos;s always free</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            <li>Every feature: assistant, experiments, reviews, popups, email flows, loyalty</li>
            <li>As many stores, products and orders as you like</li>
            <li>Full backups and CSV exports</li>
            <li>No cut of your sales</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-bg p-6">
          <h2 className="font-semibold">Read before you trust the numbers</h2>
          <p className="mt-3 text-sm text-muted">
            Provider prices are approximate as of November 2026 and change. Check each provider&apos;s current pricing and terms — some free
            hosting tiers don&apos;t allow commercial use. Card fees shown are typical US online card rates; other methods and countries differ.
          </p>
        </div>
      </section>
    </div>
  );
}

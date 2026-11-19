import type { Metadata } from "next";
import { PricingTable } from "./PricingTable";
import { LinkButton } from "@/components/ui";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <h1 className="font-display text-5xl">Simple plans that grow with you</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">Build for free. Pick a plan when you&apos;re ready to take real orders. No platform fee on your sales.</p>
      </div>
      <PricingTable />
      <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-muted">
        * Design credits are used when the assistant builds or changes your store — pages, layout, copy and images. Running the business (answering
        questions, handling orders, drafting emails) never uses credits. Card processing is passed through at cost. Demo prices — nothing here is billed.
      </p>
      <div className="mt-16 rounded-xl border border-border bg-surface p-8 text-center">
        <h2 className="font-display text-2xl">Got questions first?</h2>
        <p className="mt-2 text-sm text-muted">Plans, billing, migration and data — it&apos;s all in the FAQ.</p>
        <LinkButton href="/faq#billing" variant="secondary" className="mt-5">Read the FAQ</LinkButton>
      </div>
    </div>
  );
}

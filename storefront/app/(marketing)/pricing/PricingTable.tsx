"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { LinkButton } from "@/components/ui";
import { cx } from "@/lib/format";

type Plan = {
  name: string;
  blurb: string;
  monthly: number | null;
  credits: string;
  limits: string[];
  extras: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

const CORE = ["AI store designer", "AI product imagery", "Email flows & campaigns", "Multi-currency & automatic tax", "A/B/n experiments", "Advanced reporting"];

const PLANS: Plan[] = [
  { name: "Launch", blurb: "Your first store, done properly.", monthly: 39, credits: "Builds 2 full store designs / mo*", limits: ["1 store", "1 seat", "1 custom domain"], extras: ["Email support"], cta: "Start free", href: "/create" },
  { name: "Grow", blurb: "For brands finding their feet.", monthly: 99, credits: "Builds 6 full store designs / mo*", limits: ["3 stores", "5 seats", "3 custom domains"], extras: ["Priority support"], cta: "Start free", href: "/create", featured: true },
  { name: "Scale", blurb: "Teams running several storefronts.", monthly: 279, credits: "Builds 20 full store designs / mo*", limits: ["10 stores", "15 seats", "10 custom domains"], extras: ["Shared chat channel + priority support", "Dedicated onboarding"], cta: "Start free", href: "/create" },
  { name: "Enterprise", blurb: "High-volume and custom needs.", monthly: null, credits: "Unlimited design credits", limits: ["Unlimited stores", "Unlimited seats", "Unlimited domains"], extras: ["Unlimited assistant capacity", "Custom SLA", "Named success lead"], cta: "Contact us", href: "/faq#contact" },
];

export function PricingTable() {
  const [yearly, setYearly] = useState(true);
  const periods: [string, boolean][] = [
    ["Monthly", false],
    ["Yearly", true],
  ];
  return (
    <>
      <div className="mt-10 flex items-center justify-center">
        <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border border-border bg-surface p-1 text-sm">
          {periods.map(([label, val]) => (
            <button
              key={label}
              role="radio"
              aria-checked={yearly === val}
              onClick={() => setYearly(val)}
              className={cx("rounded-full px-4 py-1.5", yearly === val ? "bg-bg font-medium shadow-card" : "text-muted")}
            >
              {label}
              {val && <span className="ml-2 rounded-full bg-success/10 px-1.5 py-0.5 text-xs text-success">−20%</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => {
          const price = p.monthly === null ? null : yearly ? Math.round(p.monthly * 0.8) : p.monthly;
          const saving = p.monthly === null ? 0 : (p.monthly - Math.round(p.monthly * 0.8)) * 12;
          const sub = p.featured ? "text-on-ink/70" : "text-muted";
          return (
            <div key={p.name} className={cx("relative flex flex-col rounded-xl border p-6", p.featured ? "border-ink bg-ink text-on-ink shadow-pop" : "border-border bg-bg")}>
              {p.featured && <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-xs font-medium text-on-accent">Most popular</span>}
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <p className={cx("mt-1 min-h-10 text-sm", sub)}>{p.blurb}</p>
              <div className="mt-6 flex items-baseline gap-1">
                {price === null ? (
                  <span className="text-4xl font-semibold">Custom</span>
                ) : (
                  <>
                    <span className="text-4xl font-semibold">${price}</span>
                    <span className={sub}>/mo</span>
                  </>
                )}
              </div>
              <p className={cx("mt-1 h-4 text-xs", sub)}>{price !== null && (yearly ? `Billed yearly — save $${saving}` : "Billed monthly")}</p>
              <p className={cx("mt-4 min-h-12 rounded-md px-3 py-2 text-xs", p.featured ? "bg-white/10" : "bg-surface")}>{p.credits}</p>
              <LinkButton href={p.href} variant={p.featured ? "accent" : "secondary"} className="mt-5 w-full">
                {p.cta}
              </LinkButton>
              <ul className="mt-6 space-y-2 text-sm">
                {[...p.limits, ...CORE, ...p.extras].map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className={cx("mt-0.5 h-4 w-4 shrink-0", p.featured ? "text-on-ink" : "text-success")} aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-sm text-muted">30-day launch promise on Launch, Grow and Scale · Secure checkout (demo)</p>
    </>
  );
}

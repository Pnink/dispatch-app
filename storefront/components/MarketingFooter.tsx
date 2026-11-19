import Link from "next/link";
import { Logo } from "./Logo";
import { BRAND } from "@/lib/brand";

const COLS: { title: string; links: [string, string][] }[] = [
  { title: "Build", links: [["New store", "/create"], ["Examples", "/examples"], ["Features", "/#features"]] },
  { title: "Run", links: [["Dashboard", "/dashboard"], ["Experiments", "/dashboard/experiments"], ["Your data", "/dashboard/settings"]] },
  { title: "Know", links: [["Costs", "/costs"], ["FAQ", "/faq"], ["Why", "/about"]] },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[2fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">{BRAND.tagline} No plans, no cut of your sales, nothing on your storefront that says who built it.</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h3 className="text-sm font-semibold">{c.title}</h3>
            <ul className="mt-3 space-y-2">
              {c.links.map(([label, href]) => (
                <li key={label}><Link href={href} className="text-sm text-muted hover:text-text">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">Private build. Your data is saved on the computer that runs it.</div>
      </div>
    </footer>
  );
}

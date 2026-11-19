import Link from "next/link";
import { Logo } from "./Logo";

const COLS: { title: string; links: [string, string][] }[] = [
  { title: "Product", links: [["Store design", "/#design"], ["Email", "/#email"], ["Search visibility", "/#search"], ["Imagery", "/#photos"], ["Experiments", "/#testing"]] },
  { title: "Solutions", links: [["New brands", "/create"], ["Migration", "/faq#migration"], ["Multi-store", "/pricing"]] },
  { title: "Resources", links: [["Examples", "/examples"], ["FAQ", "/faq"], ["Demo dashboard", "/dashboard"]] },
  { title: "Support", links: [["Contact", "/faq#contact"], ["Pricing", "/pricing"]] },
  { title: "Company", links: [["About", "/about"]] },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(5,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">A personal demo of an AI-native commerce platform. Not a real company.</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h3 className="text-sm font-semibold">{c.title}</h3>
            <ul className="mt-3 space-y-2">
              {c.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted hover:text-text">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:justify-between sm:px-6">
          <span>© 2026 Forgecart (demo). All data is stored in your browser.</span>
          <span>Terms · Privacy · Cookies</span>
        </div>
      </div>
    </footer>
  );
}

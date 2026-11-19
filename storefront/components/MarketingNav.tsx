"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { LinkButton } from "./ui";

const PRODUCT = [
  { href: "/#design", title: "Store design", desc: "A full storefront from one sentence" },
  { href: "/#email", title: "Email", desc: "Flows written and sent for you" },
  { href: "/#search", title: "Search visibility", desc: "SEO and answer-engine ready" },
  { href: "/#photos", title: "Product imagery", desc: "Consistent shots for every product" },
  { href: "/#testing", title: "Experiments", desc: "Variants tested, winners kept" },
];
const SOLUTIONS = [
  { href: "/create", title: "Start a new brand", desc: "Go from idea to first sale" },
  { href: "/faq#migration", title: "Move an existing store", desc: "Bring products, customers and orders" },
  { href: "/pricing", title: "Scale to many storefronts", desc: "One admin, several brands" },
];

function Dropdown({ label, items }: { label: string; items: typeof PRODUCT }) {
  return (
    <div className="group relative">
      <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted hover:text-text" aria-haspopup="true">
        {label} <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </button>
      <div className="invisible absolute left-0 top-full z-50 w-72 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="rounded-lg border border-border bg-bg p-2 shadow-pop">
          {items.map((i) => (
            <Link key={i.href + i.title} href={i.href} className="block rounded-md px-3 py-2 hover:bg-surface">
              <div className="text-sm font-medium">{i.title}</div>
              <div className="text-xs text-muted">{i.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main">
        <div className="flex items-center gap-6">
          <Logo />
          <div className="hidden items-center md:flex">
            <Dropdown label="Product" items={PRODUCT} />
            <Dropdown label="Solutions" items={SOLUTIONS} />
            <Link href="/examples" className="rounded-md px-3 py-2 text-sm text-muted hover:text-text">Examples</Link>
            <Link href="/pricing" className="rounded-md px-3 py-2 text-sm text-muted hover:text-text">Pricing</Link>
          </div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <LinkButton href="/dashboard" variant="ghost" size="sm">Log in</LinkButton>
          <LinkButton href="/create" size="sm">Sign up</LinkButton>
        </div>
        <button className="rounded-md p-2 md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-border bg-bg px-4 py-3 md:hidden">
          {[...PRODUCT.slice(0, 2), { href: "/examples", title: "Examples" }, { href: "/pricing", title: "Pricing" }, { href: "/faq", title: "FAQ" }, { href: "/about", title: "About" }].map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm">
              {l.title}
            </Link>
          ))}
          <div className="mt-2 flex gap-2">
            <LinkButton href="/dashboard" variant="secondary" size="sm" className="flex-1">Log in</LinkButton>
            <LinkButton href="/create" size="sm" className="flex-1">Sign up</LinkButton>
          </div>
        </div>
      )}
    </header>
  );
}

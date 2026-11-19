"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { LinkButton } from "./ui";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/examples", label: "Examples" },
  { href: "/costs", label: "Costs" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "Why" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm text-muted hover:text-text">{l.label}</Link>
            ))}
          </div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <LinkButton href="/dashboard" variant="ghost" size="sm">Open app</LinkButton>
          <LinkButton href="/create" variant="accent" size="sm">New store</LinkButton>
        </div>
        <button className="rounded-md p-2 md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-border bg-bg px-4 py-3 md:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm">{l.label}</Link>
          ))}
          <div className="mt-2 flex gap-2">
            <LinkButton href="/dashboard" variant="secondary" size="sm" className="flex-1">Open app</LinkButton>
            <LinkButton href="/create" variant="accent" size="sm" className="flex-1">New store</LinkButton>
          </div>
        </div>
      )}
    </header>
  );
}

import Link from "next/link";
import { BRAND } from "@/lib/brand";

/** Tillery mark: a till drawer seen from the front — a counter line over an open drawer with a coin slot. Draft art. */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <rect x="6" y="8.5" width="20" height="3" rx="1.5" className="fill-on-accent" />
      <path d="M8 14h16l-1.6 9.5H9.6z" className="fill-on-accent" />
      <rect x="13" y="17" width="6" height="2.2" rx="1.1" className="fill-accent" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-text" aria-label={`${BRAND.name} home`}>
      <LogoMark />
      <span className="font-display text-xl">{BRAND.wordmark}</span>
    </Link>
  );
}

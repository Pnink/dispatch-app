import Link from "next/link";
import { BRAND } from "@/lib/brand";

/** Wharf mark: a pier (plank on two pilings) over a wave line, in a rounded square. Draft art. */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <rect x="6" y="10" width="20" height="3.2" rx="1.6" className="fill-on-accent" />
      <rect x="9.5" y="13" width="3" height="9" rx="1" className="fill-on-accent" />
      <rect x="19.5" y="13" width="3" height="9" rx="1" className="fill-on-accent" />
      <path d="M5 23.5c2.2-1.6 4.3-1.6 6.5 0s4.3 1.6 6.5 0 4.3-1.6 6.5 0 2.2 1.2 2.5 1" fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-on-accent" />
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

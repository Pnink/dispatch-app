import Link from "next/link";
import { BRAND } from "@/lib/brand";

/** Kovaz mark: a geometric K — an upright stroke with an arrow-like arm, read as "up and onward". Draft art. */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <rect x="9" y="7.5" width="4" height="17" rx="2" className="fill-on-accent" />
      <path d="M14.5 16 22 8.5h-5.2L12.6 14v4l4.2 5.5H22z" className="fill-on-accent" />
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

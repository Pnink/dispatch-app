import Link from "next/link";

/** Placeholder mark: a simple anvil-ish square glyph. Not derived from any real brand. */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-ink" />
      <path d="M9 11h14l-3 5h-4v5h-3v-5H9z" className="fill-on-ink" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight text-text" aria-label="Forgecart home">
      <LogoMark />
      <span className="text-lg">Forgecart</span>
    </Link>
  );
}

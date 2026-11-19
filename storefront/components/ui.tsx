import Link from "next/link";
import { cx } from "@/lib/format";
import type { ComponentProps } from "react";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-ink text-on-ink hover:bg-ink/85",
  accent: "bg-accent text-on-accent hover:bg-accent/90",
  secondary: "border border-border bg-bg text-text hover:bg-surface",
  ghost: "text-text hover:bg-surface",
  danger: "border border-danger/30 text-danger hover:bg-danger/5",
};
const sizes: Record<Size, string> = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" };

export function btn(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cx(base, variants[variant], sizes[size], extra);
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button className={btn(variant, size, className)} disabled={loading || props.disabled} aria-busy={loading || undefined} {...props}>
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={btn(variant, size, className)} {...props} />;
}

export function Chip({ selected, className, ...props }: ComponentProps<"button"> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        selected ? "border-ink bg-ink text-on-ink" : "border-border bg-bg text-text hover:border-border-input",
        className,
      )}
      {...props}
    />
  );
}

export function Field({ label, error, hint, className, id, ...props }: ComponentProps<"input"> & { label: string; error?: string; hint?: string }) {
  const fid = id || props.name;
  return (
    <div className={className}>
      <label htmlFor={fid} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={fid}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${fid}-err` : undefined}
        className={cx(
          "h-10 w-full rounded-md border bg-bg px-3 text-sm outline-none focus:ring-2 focus:ring-accent/40",
          error ? "border-danger" : "border-border-input/60 focus:border-accent",
        )}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${fid}-err`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors", checked ? "bg-accent" : "bg-border-input/50")}
    >
      <span className={cx("inline-block h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "danger" | "accent"; children: React.ReactNode }) {
  const tones = {
    neutral: "bg-surface text-muted",
    success: "bg-success/10 text-success",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-danger/10 text-danger",
    accent: "bg-accent-soft text-accent",
  };
  return <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

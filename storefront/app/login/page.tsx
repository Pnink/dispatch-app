"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui";
import { BRAND } from "@/lib/brand";

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}

function Login() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // only allow same-site paths as the return address (no open redirects)
  const raw = params.get("next") || "/dashboard";
  const next = raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : "/dashboard";

  return (
    <div className="grid min-h-dvh place-items-center bg-surface p-6">
      <form
        className="w-full max-w-sm rounded-2xl border border-border bg-bg p-8 shadow-pop"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
          setBusy(false);
          if (res.ok) window.location.href = next;
          else setError((await res.json().catch(() => ({}))).error || "Couldn't sign in.");
        }}
      >
        <LogoMark className="h-10 w-10" />
        <h1 className="mt-5 text-xl font-semibold">Sign in to {BRAND.wordmark}</h1>
        <p className="mt-1 text-sm text-muted">Owner access only.</p>
        <label htmlFor="pw" className="mt-6 block text-sm font-medium">Password</label>
        <input
          id="pw"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error || undefined}
          className="mt-1 h-11 w-full rounded-md border border-border-input/60 px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
        />
        {error && <p className="mt-2 text-sm text-danger" role="alert">{error}</p>}
        <Button type="submit" variant="accent" loading={busy} disabled={!password} className="mt-5 w-full"><Lock className="h-4 w-4" /> Sign in</Button>
      </form>
    </div>
  );
}

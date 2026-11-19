"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, ImagePlus, Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { CATEGORY_CHIPS, detectCategory, generationSteps } from "@/lib/ai";
import { createStore, deleteStore, updateStore, useStore } from "@/lib/store";
import type { Category } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Button, Chip } from "@/components/ui";
import { StoreHeader, StoreHome, StoreTheme } from "@/components/storefront";
import { money } from "@/lib/format";

type Phase = "describe" | "generating" | "review";

export default function CreatePage() {
  return (
    <Suspense>
      <Create />
    </Suspense>
  );
}

function Create() {
  const params = useSearchParams();
  const router = useRouter();
  const [prompt, setPrompt] = useState(params.get("prompt") ?? "");
  const [category, setCategory] = useState<Category | undefined>((params.get("category") as Category) || undefined);
  const [image, setImage] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("describe");
  const [step, setStep] = useState(0);
  const [slug, setSlug] = useState<string>();
  const [error, setError] = useState("");
  const started = useRef(false);

  // Auto-start when arriving from the homepage prompt box.
  useEffect(() => {
    if (!started.current && params.get("prompt")) {
      started.current = true;
      start(params.get("prompt")!, (params.get("category") as Category) || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function start(text: string, cat?: Category) {
    if (text.trim().length < 8) {
      setError("Tell us a little more — what you sell and the feel you want (8+ characters).");
      return;
    }
    setError("");
    setPhase("generating");
    setStep(0);
    const steps = generationSteps(cat ?? detectCategory(text)).length;
    let i = 0;
    const tick = setInterval(() => {
      i++;
      setStep(i);
      if (i >= steps) {
        clearInterval(tick);
        const s = createStore(text.trim(), cat);
        setSlug(s.slug);
        setTimeout(() => setPhase("review"), 350);
      }
    }, 650);
  }

  const steps = generationSteps(category ?? detectCategory(prompt));

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="flex h-16 items-center justify-between border-b border-border bg-bg px-4 sm:px-6">
        <Logo />
        <Link href="/dashboard" className="text-sm text-muted hover:text-text">Go to dashboard</Link>
      </header>

      {phase === "describe" && (
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-16">
          <h1 className="text-center font-display text-4xl sm:text-5xl">What are you selling?</h1>
          <p className="mt-3 text-center text-muted">Describe the store in a sentence. Mention products, audience, colours or mood — the more specific, the better.</p>
          <form
            className="mt-8 rounded-xl border border-border bg-bg p-4 shadow-pop"
            onSubmit={(e) => {
              e.preventDefault();
              start(prompt, category);
            }}
          >
            <label htmlFor="brief" className="sr-only">Store description</label>
            <textarea
              id="brief"
              rows={4}
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              aria-invalid={!!error || undefined}
              placeholder="e.g. A small-batch coffee roaster with subscriptions and a warm, cosy feel"
              className="w-full resize-none bg-transparent text-base outline-none placeholder:text-muted"
            />
            {image && (
              <div className="relative mb-3 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Reference" className="h-16 w-16 rounded-md object-cover" />
                <button type="button" onClick={() => setImage(null)} aria-label="Remove reference image" className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-ink text-on-ink">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {error && <p className="mb-2 text-sm text-danger" role="alert">{error}</p>}
            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted hover:text-text">
                <ImagePlus className="h-4 w-4" aria-hidden /> Reference image
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setImage(URL.createObjectURL(f));
                  }}
                />
              </label>
              <Button type="submit" variant="accent"><Sparkles className="h-4 w-4" /> Generate my store</Button>
            </div>
          </form>
          <p className="mt-6 text-center text-xs uppercase tracking-widest text-muted">Or start from a category</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {CATEGORY_CHIPS.map((c) => (
              <Chip
                key={c.label}
                selected={category === c.category && prompt === c.prompt}
                onClick={() => {
                  setPrompt(c.prompt);
                  setCategory(c.category);
                }}
              >
                {c.label}
              </Chip>
            ))}
          </div>
        </main>
      )}

      {phase === "generating" && (
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16" aria-live="polite">
          <div className="rounded-xl border border-border bg-bg p-6 shadow-pop">
            <div className="flex items-center gap-2 text-sm text-muted"><Sparkles className="h-4 w-4 text-accent" /> Building your store</div>
            <p className="mt-2 line-clamp-2 font-medium">&ldquo;{prompt}&rdquo;</p>
            <ol className="mt-6 space-y-4">
              {steps.map((s, i) => (
                <li key={s.label} className="flex gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center">
                    {i < step ? <Check className="h-4 w-4 text-success" /> : i === step ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> : <span className="h-2 w-2 rounded-full bg-border" />}
                  </span>
                  <div className={i > step ? "opacity-40" : ""}>
                    <div className="text-sm font-medium">{s.label}</div>
                    {i <= step && <div className="text-xs text-muted">{s.detail}</div>}
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-surface">
              <div className="h-full bg-accent transition-all duration-500" style={{ width: `${Math.min(100, (step / steps.length) * 100)}%` }} />
            </div>
          </div>
        </main>
      )}

      {phase === "review" && slug && (
        <Review
          slug={slug}
          onRetry={() => {
            deleteStore(slug);
            setSlug(undefined);
            setPhase("describe");
          }}
          onPublish={() => {
            updateStore(slug, (s) => ({ ...s, published: true }));
            router.push("/dashboard?welcome=1");
          }}
        />
      )}
    </div>
  );
}

function Review({ slug, onRetry, onPublish }: { slug: string; onRetry: () => void; onPublish: () => void }) {
  const store = useStore(slug);
  if (!store) return null;
  return (
    <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-8 lg:grid-cols-[340px_1fr] sm:px-6">
      <aside className="space-y-5">
        <div className="rounded-xl border border-border bg-bg p-5">
          <div className="flex items-center gap-2 text-sm text-success"><Check className="h-4 w-4" /> Your store is ready to review</div>
          <label htmlFor="store-name" className="mt-4 block text-xs text-muted">Store name</label>
          <input
            id="store-name"
            value={store.name}
            onChange={(e) => updateStore(slug, (s) => ({ ...s, name: e.target.value }))}
            className="mt-1 w-full rounded-md border border-border-input/60 px-3 py-2 text-lg font-semibold outline-none focus:border-accent"
          />
          <div className="mt-4 text-xs text-muted">Palette</div>
          <div className="mt-2 flex gap-2">
            {(["accent", "bg", "soft", "text"] as const).map((k) => (
              <span key={k} title={k} className="h-8 w-8 rounded-full border border-border" style={{ background: store.palette[k] }} />
            ))}
            <span className="ml-2 self-center text-xs capitalize text-muted">{store.font} type</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-bg p-5">
          <div className="text-sm font-medium">{store.products.length} products created</div>
          <ul className="mt-3 space-y-2 text-sm">
            {store.products.map((p) => (
              <li key={p.id} className="flex justify-between gap-2"><span className="truncate">{p.title}</span><span className="text-muted">{money(p.priceCents)}</span></li>
            ))}
          </ul>
          <div className="mt-4 text-sm font-medium">Switched on for you</div>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li>✓ Product reviews ({store.reviews.length} sample reviews)</li>
            <li>✓ Welcome popup with code {store.popup.code}</li>
            <li>✓ {store.flows.filter((f) => f.enabled).length} email flows</li>
            <li>✓ Guest checkout</li>
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="accent" size="lg" onClick={onPublish}>Publish & open dashboard</Button>
          <Button variant="secondary" onClick={onRetry}><RefreshCw className="h-4 w-4" /> Start over</Button>
          <Link href="/" className="mt-1 flex items-center justify-center gap-1 text-xs text-muted hover:text-text"><ArrowLeft className="h-3 w-3" /> Back to site</Link>
        </div>
      </aside>
      <section aria-label="Storefront preview" className="overflow-hidden rounded-xl border border-border bg-bg shadow-pop">
        <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-border" /><span className="h-2.5 w-2.5 rounded-full bg-border" /><span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="ml-3 truncate rounded bg-surface px-2 py-0.5 text-xs text-muted">/store/{store.slug}</span>
          <Link href={`/store/${store.slug}`} target="_blank" className="ml-auto text-xs text-accent hover:underline">Open in new tab</Link>
        </div>
        <div className="max-h-[75vh] overflow-y-auto">
          <StoreTheme store={store}>
            <StoreHeader store={store} base={`/store/${store.slug}`} />
            <StoreHome store={store} base={`/store/${store.slug}`} />
          </StoreTheme>
        </div>
      </section>
    </main>
  );
}

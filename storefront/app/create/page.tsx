"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, ImagePlus, Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { CATEGORY_CHIPS, detectCategory, generationSteps } from "@/lib/ai";
import { createStore, deleteStore, updateStore, useStore } from "@/lib/store";
import { ensureAiSettings, generateWithAi, isFree, modelName, useAiSettings } from "@/lib/ai-client";
import { applyGenerated } from "@/lib/ai-actions";
import { buildFromPhotos } from "@/lib/photo-store";
import { preparePhoto, uploadPhoto, type PreparedPhoto } from "@/lib/media-client";
import type { Category } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Button, Chip } from "@/components/ui";
import { StoreHeader, StoreHome, StoreTheme } from "@/components/storefront";
import { cx, money } from "@/lib/format";

type Phase = "describe" | "generating" | "review";
const MAX_PHOTOS = 8;
const AUTO_KEY = "sf:auto-live";

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
  const ai = useAiSettings();
  const [prompt, setPrompt] = useState(params.get("prompt") ?? "");
  const [category, setCategory] = useState<Category | undefined>((params.get("category") as Category) || undefined);
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [preparing, setPreparing] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [autoLive, setAutoLive] = useState(params.get("review") !== "1");
  const [phase, setPhase] = useState<Phase>("describe");
  const [step, setStep] = useState(0);
  const [slug, setSlug] = useState<string>();
  const [error, setError] = useState("");
  const [aiNote, setAiNote] = useState("");
  const started = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.get("review") === "1") return;
    try {
      const v = localStorage.getItem(AUTO_KEY);
      if (v !== null) setAutoLive(v === "1");
    } catch {
      /* ignore */
    }
  }, [params]);

  // Auto-start when arriving from the homepage prompt box.
  useEffect(() => {
    if (!started.current && params.get("prompt")) {
      started.current = true;
      start(params.get("prompt")!, (params.get("category") as Category) || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addFiles(list: FileList | File[]) {
    const files = Array.from(list).slice(0, MAX_PHOTOS - photos.length);
    if (!files.length) return;
    setError("");
    setPreparing((n) => n + files.length);
    for (const f of files) {
      try {
        const p = await preparePhoto(f);
        setPhotos((cur) => (cur.length < MAX_PHOTOS ? [...cur, p] : cur));
      } catch (e) {
        setError((e as Error).message);
      }
      setPreparing((n) => n - 1);
    }
  }

  function start(rawText: string, cat?: Category) {
    const text = rawText.trim();
    if (!photos.length && text.length < 8) {
      setError("Add a photo of your product, or describe your store in a sentence.");
      return;
    }
    setError("");
    setPhase("generating");
    setStep(0);
    const steps = stepList(text, cat).length;

    const work = (async () => {
      const ids = await Promise.all(photos.map((p) => uploadPhoto(p.blob)));
      const st = await ensureAiSettings();
      const r = !isFree(st) ? await generateWithAi(text, cat, ids) : null;
      return { ids, r };
    })();

    let i = 0;
    const tick = setInterval(() => {
      if (i < steps - 1) {
        i++;
        setStep(i);
        return;
      }
      clearInterval(tick);
      work
        .then(({ ids, r }) => {
          setStep(steps);
          const brief = text || "A small independent shop";
          const transform =
            r && r.ok
              ? (b: Parameters<typeof applyGenerated>[0]) => applyGenerated(b, r.store, ids)
              : ids.length
                ? (b: Parameters<typeof applyGenerated>[0]) => buildFromPhotos(b, ids.map((id, k) => ({ id, name: photos[k].name })), text, photos[0].accent)
                : undefined;
          const s = createStore(brief, cat, transform);
          setAiNote(r ? (r.ok ? `Written by ${r.label}` : `AI model unavailable (${r.error}) — built with the free builder instead.`) : "");
          if (autoLive) {
            updateStore(s.slug, (x) => ({ ...x, published: true }));
            router.push("/dashboard?welcome=1");
            return;
          }
          setSlug(s.slug);
          setTimeout(() => setPhase("review"), 350);
        })
        .catch((e: Error) => {
          setError(e.message || "Something went wrong. Try again.");
          setPhase("describe");
        });
    }, 650);
  }

  function stepList(text: string, cat?: Category) {
    const base = generationSteps(cat ?? detectCategory(text));
    if (!photos.length) return base;
    return [
      { label: "Uploading your photos", detail: `${photos.length} photo${photos.length > 1 ? "s" : ""}, resized and cleaned of location data` },
      { label: "Looking at your products", detail: "Working out what each one is, its colours and materials" },
      ...base.filter((s) => s.label !== "Generating product imagery" && s.label !== "Reading your brief"),
    ];
  }

  const steps = stepList(prompt.trim(), category);
  const modelLabel = !ai ? "" : isFree(ai) ? "the free builder" : ai.aiModel === "auto" ? "Auto (it picks the best model)" : modelName(ai);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="flex h-16 items-center justify-between border-b border-border bg-bg px-4 sm:px-6">
        <Logo />
        <Link href="/dashboard" className="text-sm text-muted hover:text-text">Go to dashboard</Link>
      </header>

      {phase === "describe" && (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12">
          <h1 className="text-center font-display text-4xl sm:text-5xl">Show us what you sell</h1>
          <p className="mt-3 text-center text-muted">Drop in photos of your products and say a few words. We&apos;ll build the whole store — name, design, product pages, checkout — and put it live.</p>
          <form
            className="mt-8 space-y-4 rounded-2xl border border-border bg-bg p-5 shadow-pop"
            onSubmit={(e) => {
              e.preventDefault();
              start(prompt, category);
            }}
          >
            {/* photo drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              className={cx("rounded-xl border-2 border-dashed p-4 transition-colors", dragging ? "border-accent bg-accent-soft" : "border-border")}
            >
              {photos.length === 0 && preparing === 0 ? (
                <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center gap-2 py-8 text-center">
                  <ImagePlus className="h-8 w-8 text-accent" aria-hidden />
                  <span className="font-medium">Drop product photos here, or click to choose</span>
                  <span className="text-sm text-muted">One photo per product · up to {MAX_PHOTOS} · JPG, PNG, WebP or HEIC</span>
                </button>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {photos.map((p, i) => (
                    <div key={p.url} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={`Product photo ${i + 1}`} className="h-24 w-24 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotos((cur) => cur.filter((x) => x !== p))}
                        aria-label={`Remove photo ${i + 1}`}
                        className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-on-ink"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {Array.from({ length: preparing }).map((_, i) => (
                    <div key={`p${i}`} className="grid h-24 w-24 place-items-center rounded-lg bg-surface"><Loader2 className="h-5 w-5 animate-spin text-muted" /></div>
                  ))}
                  {photos.length + preparing < MAX_PHOTOS && (
                    <button type="button" onClick={() => fileRef.current?.click()} className="grid h-24 w-24 place-items-center rounded-lg border border-dashed border-border-input/60 text-muted hover:text-text" aria-label="Add more photos">
                      <ImagePlus className="h-6 w-6" />
                    </button>
                  )}
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                aria-label="Product photos"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            <div>
              <label htmlFor="brief" className="mb-1 block text-sm font-medium">
                Tell us about it <span className="font-normal text-muted">{photos.length ? "(optional)" : ""}</span>
              </label>
              <textarea
                id="brief"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                aria-invalid={!!error || undefined}
                placeholder={"Brand name, what it is, prices, sizes, the feel you want. One product per line works well, e.g.\nJuniper Candle Co — hand-poured soy candles\nLavender candle 8oz - $24\nCedar candle 12oz - $32"}
                className="w-full resize-none rounded-md border border-border-input/60 p-3 text-sm outline-none placeholder:text-muted focus:border-accent"
              />
            </div>

            {error && <p className="text-sm text-danger" role="alert">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoLive}
                  onChange={(e) => {
                    setAutoLive(e.target.checked);
                    try {
                      localStorage.setItem(AUTO_KEY, e.target.checked ? "1" : "0");
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                Put it live as soon as it&apos;s ready
              </label>
              <Button type="submit" variant="accent" size="lg" disabled={preparing > 0}><Sparkles className="h-4 w-4" /> Build my store</Button>
            </div>
            {modelLabel && (
              <p className="text-xs text-muted">
                Built with <strong>{modelLabel}</strong>.{" "}
                {isFree(ai) ? (
                  <>For copy written from your photos, add an AI key (see <Link href="/dashboard/settings#ai" className="underline">Settings</Link>).</>
                ) : (
                  <>The model looks at your photos and writes everything. <Link href="/dashboard/settings#ai" className="underline">Change</Link></>
                )}
              </p>
            )}
          </form>
          <p className="mt-6 text-center text-xs uppercase tracking-widest text-muted">No photos yet? Start from an idea</p>
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
            {photos.length > 0 && (
              <div className="mt-3 flex gap-2">
                {photos.map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.url} src={p.url} alt={`Product photo ${i + 1}`} className="h-12 w-12 rounded-md object-cover" />
                ))}
              </div>
            )}
            {prompt.trim() && <p className="mt-2 line-clamp-2 font-medium">&ldquo;{prompt}&rdquo;</p>}
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
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
          aiNote={aiNote}
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

function Review({ slug, aiNote, onRetry, onPublish }: { slug: string; aiNote: string; onRetry: () => void; onPublish: () => void }) {
  const store = useStore(slug);
  if (!store) return null;
  return (
    <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-8 lg:grid-cols-[340px_1fr] sm:px-6">
      <aside className="space-y-5">
        <div className="rounded-xl border border-border bg-bg p-5">
          <div className="flex items-center gap-2 text-sm text-success"><Check className="h-4 w-4" /> Your store is ready to review</div>
          {aiNote && <p className={`mt-1 text-xs ${aiNote.startsWith("Written") ? "text-muted" : "text-buoy"}`} data-ai-note>{aiNote}</p>}
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
            <li>✓ Product reviews (collected from real buyers)</li>
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

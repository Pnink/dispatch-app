"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Blocks, Bot, BrainCircuit, Check, CloudOff, ExternalLink, FlaskConical, Home, Keyboard, Loader2, LogOut, Mail, Package, Palette, Plus, Send, Settings, ShoppingCart, Sparkles, X } from "lucide-react";
import { assistant, type AssistantAction } from "@/lib/ai";
import { askAssistant, useAiSettings } from "@/lib/ai-client";
import { toAssistantAction } from "@/lib/ai-actions";
import { findModel } from "@/lib/ai-models";
import { markOwner, saveNow, setCurrentStore, updateStore, useAdmin, useCurrentStore, type SaveState } from "@/lib/store";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { LogoMark } from "@/components/Logo";
import { Badge, LinkButton } from "@/components/ui";
import { BRAND } from "@/lib/brand";
import { cx } from "@/lib/format";

const NAV = [
  { href: "/dashboard", label: "Today", icon: Home, key: "t" },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart, key: "o" },
  { href: "/dashboard/products", label: "Products", icon: Package, key: "p" },
  { href: "/dashboard/apps", label: "Built-in apps", icon: Blocks, key: "a" },
  { href: "/dashboard/email", label: "Email", icon: Mail, key: "e" },
  { href: "/dashboard/experiments", label: "Experiments", icon: FlaskConical, key: "x" },
  { href: "/dashboard/ai", label: "AI team", icon: BrainCircuit, key: "i" },
  { href: "/dashboard/design", label: "Design", icon: Palette, key: "d" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, key: "s" },
];

const isTyping = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const admin = useAdmin();
  const store = useCurrentStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [passwordOn, setPasswordOn] = useState(false);
  const palette = useCommandPalette();

  useEffect(() => {
    markOwner(); // this browser belongs to the owner: show owner tools on storefronts here
    setChatOpen(window.matchMedia("(min-width: 1440px)").matches);
    fetch("/api/auth/login").then((r) => r.json()).then((d) => setPasswordOn(!!d.passwordConfigured)).catch(() => {});
  }, []);

  // desktop keyboard shortcuts
  useEffect(() => {
    let g = 0;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveNow();
        return;
      }
      if (mod && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setChatOpen((v) => !v);
        return;
      }
      if (mod || e.altKey || isTyping(e.target)) return;
      if (e.key === "?") return setHelp((v) => !v);
      if (e.key === "Escape") return setHelp(false);
      if (e.key === "g") {
        g = Date.now();
        return;
      }
      if (Date.now() - g < 1200) {
        const hit = NAV.find((n) => n.key === e.key.toLowerCase());
        if (hit) router.push(hit.href);
        g = 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (admin.status === "idle" || admin.status === "loading")
    return (
      <div className="grid min-h-dvh place-items-center bg-surface text-sm text-muted" aria-busy="true">
        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Opening your shop…</span>
      </div>
    );

  if (admin.status === "locked" || admin.status === "error")
    return (
      <div className="grid min-h-dvh place-items-center bg-surface p-6 text-center">
        <div className="max-w-md">
          <AlertTriangle className="mx-auto h-8 w-8 text-buoy" aria-hidden />
          <h1 className="mt-3 text-xl font-semibold">{admin.status === "locked" ? "Locked" : "Can't reach the app"}</h1>
          <p className="mt-2 text-sm text-muted">{admin.error}</p>
          {admin.status === "error" && <button onClick={() => window.location.reload()} className="mt-5 rounded-md bg-ink px-4 py-2 text-sm text-on-ink">Try again</button>}
        </div>
      </div>
    );

  if (!store) return <FirstRun />;

  const toShip = store.orders.filter((o) => o.status === "paid").length;

  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-bg md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <LogoMark className="h-6 w-6" />
          <label htmlFor="store-switch" className="sr-only">Current store</label>
          <select
            id="store-switch"
            value={store.slug}
            onChange={(e) => (e.target.value === "__new" ? router.push("/create") : setCurrentStore(e.target.value))}
            className="min-w-0 flex-1 truncate bg-transparent text-sm font-semibold outline-none"
          >
            {admin.db.stores.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
            <option value="__new">+ New store…</option>
          </select>
        </div>
        <nav className="flex-1 space-y-0.5 p-2" aria-label="Dashboard">
          {NAV.map(({ href, label, icon: Icon, key }) => {
            const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} aria-keyshortcuts={`g ${key}`} className={cx("group flex items-center gap-3 rounded-md px-3 py-2 text-sm", active ? "bg-surface font-medium text-text" : "text-muted hover:bg-surface hover:text-text")}>
                <Icon className="h-4 w-4" aria-hidden /> {label}
                {label === "Orders" && toShip > 0 ? (
                  <span className="ml-auto rounded-full bg-accent px-1.5 text-[10px] font-semibold text-on-accent">{toShip}</span>
                ) : (
                  <kbd className="ml-auto hidden rounded border border-border px-1 text-[10px] text-muted group-hover:inline">G {key.toUpperCase()}</kbd>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-border p-3">
          <Link href={`/store/${store.slug}`} target="_blank" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-surface hover:text-text">
            <ExternalLink className="h-4 w-4" /> View storefront
          </Link>
          <Link href="/create" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-surface hover:text-text">
            <Plus className="h-4 w-4" /> New store
          </Link>
          <button onClick={() => setHelp(true)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-surface hover:text-text">
            <Keyboard className="h-4 w-4" /> Shortcuts <kbd className="ml-auto rounded border border-border px-1 text-[10px]">?</kbd>
          </button>
          {passwordOn && (
            <button
              onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => (window.location.href = "/login"))}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-surface hover:text-text"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-bg/90 px-4 backdrop-blur sm:px-6">
          <div className="flex gap-1 overflow-x-auto md:hidden">
            {NAV.slice(0, 5).map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} aria-label={label} className={cx("rounded-md p-2", pathname === href ? "bg-surface" : "text-muted")}><Icon className="h-4 w-4" /></Link>
            ))}
          </div>
          <div className="hidden truncate text-sm font-medium md:block">{store.name}</div>
          <Badge tone={store.published ? "success" : "warning"}>{store.published ? "Live" : "Hidden"}</Badge>
          <SaveIndicator state={admin.save} savedAt={admin.savedAt} error={admin.error} />
          <button onClick={() => palette.setOpen(true)} className="ml-auto hidden items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:bg-surface sm:flex" aria-label="Open command palette">
            Jump to… <kbd className="rounded border border-border px-1 text-[10px]">⌘K</kbd>
          </button>
          <button onClick={() => setChatOpen((v) => !v)} aria-expanded={chatOpen} aria-keyshortcuts="Control+J Meta+J" className={cx("ml-auto flex items-center gap-2 rounded-md px-3 py-1.5 text-sm sm:ml-0", chatOpen ? "bg-accent text-on-accent" : "border border-border hover:bg-surface")}>
            <Bot className="h-4 w-4" /> Assistant
          </button>
        </header>
        <div className="flex flex-1">
          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 2xl:px-12">{children}</main>
          {chatOpen && <AssistantPanel onClose={() => setChatOpen(false)} />}
        </div>
      </div>
      {palette.open && <CommandPalette onClose={() => palette.setOpen(false)} />}
      {help && <ShortcutHelp onClose={() => setHelp(false)} />}
    </div>
  );
}

function SaveIndicator({ state, savedAt, error }: { state: SaveState; savedAt?: string; error?: string }) {
  const time = savedAt ? new Date(savedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
  const map: Record<SaveState, { icon: React.ReactNode; text: string; cls: string }> = {
    saved: { icon: <Check className="h-3.5 w-3.5" />, text: time ? `Saved · ${time}` : "Saved", cls: "text-muted" },
    unsaved: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, text: "Saving…", cls: "text-muted" },
    saving: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, text: "Saving…", cls: "text-muted" },
    offline: { icon: <CloudOff className="h-3.5 w-3.5" />, text: "Offline — will retry", cls: "text-buoy" },
    error: { icon: <AlertTriangle className="h-3.5 w-3.5" />, text: "Not saved — retrying", cls: "text-danger" },
  };
  const m = map[state];
  return (
    <span className={cx("hidden items-center gap-1.5 text-xs lg:flex", m.cls)} role="status" aria-live="polite" title={state === "offline" || state === "error" ? error : "Every change saves automatically to the data folder on this computer."} data-save-state={state}>
      {m.icon} {m.text}
    </span>
  );
}

function ShortcutHelp({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ["⌘K / Ctrl+K", "Jump to any page or action"],
    ["⌘J / Ctrl+J", "Show or hide the assistant"],
    ["⌘S / Ctrl+S", "Save now (it also saves on its own)"],
    ...NAV.map((n): [string, string] => [`G then ${n.key.toUpperCase()}`, n.label]),
    ["?", "This list"],
  ];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" className="w-full max-w-md rounded-xl bg-bg p-6 shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Keyboard shortcuts</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-surface"><X className="h-4 w-4" /></button>
        </div>
        <dl className="mt-4 divide-y divide-border text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2">
              <dt className="text-muted">{v}</dt>
              <dd><kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs">{k}</kbd></dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/** No sample data: the very first screen asks for the first store. */
function FirstRun() {
  return (
    <div className="grid min-h-dvh place-items-center bg-surface p-6">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-bg p-10 text-center shadow-pop">
        <LogoMark className="mx-auto h-12 w-12" />
        <h1 className="mt-5 font-display text-4xl">Welcome to {BRAND.wordmark}</h1>
        <p className="mx-auto mt-3 max-w-sm text-muted">There&apos;s nothing here yet. Describe your first shop and it&apos;ll be ready to review in about a minute.</p>
        <LinkButton href="/create" variant="accent" size="lg" className="mt-8"><Sparkles className="h-4 w-4" /> Create my first store</LinkButton>
        <p className="mt-6 text-xs text-muted">Everything you do saves automatically to the <code className="rounded bg-surface px-1">data</code> folder on this computer.</p>
      </div>
    </div>
  );
}

type Msg = { role: "user" | "assistant"; text: string; action?: AssistantAction; done?: "applied" | "dismissed"; by?: string; error?: boolean };

function AssistantPanel({ onClose }: { onClose: () => void }) {
  const store = useCurrentStore()!;
  const pathname = usePathname();
  const page = NAV.find((n) => (n.href === "/dashboard" ? pathname === n.href : pathname.startsWith(n.href)))?.label ?? "dashboard";
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", text: `Hi! I'm keeping an eye on ${store.name}. Ask me about sales, or tell me what to change — I'll propose it and you approve.` },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // scroll the chat log itself, never the page
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  const ai = useAiSettings();
  const model = ai?.aiModel ?? "builtin";
  const modelLabel = model === "builtin" ? "Built-in rules" : (findModel(model)?.label ?? model);

  const send = async (text: string) => {
    if (!text.trim() || thinking) return;
    const next: Msg[] = [...msgs, { role: "user", text }];
    setMsgs(next);
    setInput("");
    setThinking(true);
    if (model === "builtin") {
      await new Promise((r) => setTimeout(r, 400));
      const r = assistant(text, store, page.toLowerCase());
      setMsgs((m) => [...m, { role: "assistant", text: r.text, action: r.action, by: "Built-in rules" }]);
    } else {
      const history = next.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.text }));
      const r = await askAssistant(store, page.toLowerCase(), history.slice(1)); // skip the greeting
      if (r.ok) {
        setMsgs((m) => [...m, { role: "assistant", text: r.data.reply, action: toAssistantAction(r.data.action, store), by: r.label }]);
      } else {
        // fall back to the built-in rules so the owner still gets an answer
        const fb = assistant(text, store, page.toLowerCase());
        setMsgs((m) => [...m, { role: "assistant", text: `⚠ ${r.error}`, error: true }, { role: "assistant", text: fb.text, action: fb.action, by: "Built-in rules (fallback)" }]);
      }
    }
    setThinking(false);
  };

  const resolve = (i: number, apply: boolean) => {
    const m = msgs[i];
    if (apply && m.action) updateStore(store.slug, m.action.apply);
    setMsgs((all) => all.map((x, j) => (j === i ? { ...x, done: apply ? "applied" : "dismissed" } : x)));
  };

  const suggestions = ["How are sales going?", "What's low on stock?", "Create a 20% discount", "Make the accent green"];

  return (
    <aside className="fixed inset-0 z-30 flex flex-col border-l border-border bg-bg sm:inset-auto sm:right-0 sm:top-14 sm:h-[calc(100dvh-3.5rem)] sm:w-96 xl:sticky xl:top-14" aria-label="Store assistant">
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2 text-sm font-medium"><Bot className="h-4 w-4 text-accent" /> Assistant <span className="text-xs font-normal text-muted">· on {page}</span></div>
        <button onClick={onClose} aria-label="Close assistant" className="rounded p-1 hover:bg-surface"><X className="h-4 w-4" /></button>
      </div>
      <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-auto w-fit max-w-[85%] rounded-lg bg-ink px-3 py-2 text-sm text-on-ink" : "max-w-[92%]"}>
            {m.role === "user" ? (
              m.text
            ) : (
              <div className="rounded-lg bg-surface px-3 py-2 text-sm">
                <Rich text={m.text} />
                {m.action && !m.done && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => resolve(i, true)} className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-on-accent">{m.action.label}</button>
                    <button onClick={() => resolve(i, false)} className="rounded-md border border-border bg-bg px-3 py-1.5 text-xs">Not now</button>
                  </div>
                )}
                {m.done && <div className={cx("mt-2 text-xs", m.done === "applied" ? "text-success" : "text-muted")}>{m.done === "applied" ? "✓ Done" : "Dismissed"}</div>}
                {m.by && <div className="mt-1.5 text-[10px] uppercase tracking-wide text-muted">{m.by}</div>}
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="w-fit rounded-lg bg-surface px-3 py-2 text-lg leading-none" aria-label="Assistant is thinking">
            <span className="dot">•</span><span className="dot">•</span><span className="dot">•</span>
          </div>
        )}
      </div>
      <div className="border-t border-border p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted hover:text-text">{s}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
          <label htmlFor="assistant-input" className="sr-only">Message the assistant</label>
          <input id="assistant-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask or tell it to do something…" className="h-10 flex-1 rounded-md border border-border-input/60 px-3 text-sm outline-none focus:border-accent" />
          <button type="submit" aria-label="Send" disabled={!input.trim()} className="grid h-10 w-10 place-items-center rounded-md bg-ink text-on-ink disabled:opacity-30"><Send className="h-4 w-4" /></button>
        </form>
        <p className="mt-2 text-[11px] text-muted">
          Model: <Link href="/dashboard/settings#ai" className="underline">{modelLabel}</Link>
          {model === "builtin" ? " · free, offline" : " · billed per use by the provider"}
        </p>
      </div>
    </aside>
  );
}

/** Tiny formatter: **bold** and line breaks. */
function Rich({ text }: { text: string }) {
  return (
    <div className="whitespace-pre-line">
      {text.split(/(\*\*[^*]+\*\*)/).map((part, i) => (part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>))}
    </div>
  );
}

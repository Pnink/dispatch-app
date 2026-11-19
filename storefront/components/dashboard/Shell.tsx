"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Blocks, Bot, ExternalLink, FlaskConical, Home, Mail, Package, Palette, Plus, Send, Settings, ShoppingCart, X } from "lucide-react";
import { assistant, type AssistantAction } from "@/lib/ai";
import { markOwner, setCurrentStore, updateStore, useCurrentStore, useDB } from "@/lib/store";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { LogoMark } from "@/components/Logo";
import { Badge, LinkButton } from "@/components/ui";
import { cx } from "@/lib/format";

const NAV = [
  { href: "/dashboard", label: "Today", icon: Home },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/apps", label: "Built-in apps", icon: Blocks },
  { href: "/dashboard/email", label: "Email", icon: Mail },
  { href: "/dashboard/experiments", label: "Experiments", icon: FlaskConical },
  { href: "/dashboard/design", label: "Design", icon: Palette },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const db = useDB();
  const store = useCurrentStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const palette = useCommandPalette();
  useEffect(() => {
    markOwner(); // this browser belongs to the owner: show owner tools on storefronts here
    setMounted(true);
  }, []);

  useEffect(() => {
    setChatOpen(window.matchMedia("(min-width: 1280px)").matches);
  }, []);

  if (!mounted) return <div className="min-h-dvh bg-surface" />;

  if (!store)
    return (
      <div className="grid min-h-dvh place-items-center bg-surface p-6 text-center">
        <div>
          <LogoMark className="mx-auto h-10 w-10" />
          <h1 className="mt-4 text-2xl font-semibold">No stores yet</h1>
          <p className="mt-2 text-muted">Describe your first store and we&apos;ll build it.</p>
          <LinkButton href="/create" className="mt-6">Create a store</LinkButton>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border bg-bg md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <LogoMark className="h-6 w-6" />
          <label htmlFor="store-switch" className="sr-only">Current store</label>
          <select
            id="store-switch"
            value={store.slug}
            onChange={(e) => (e.target.value === "__new" ? (window.location.href = "/create") : setCurrentStore(e.target.value))}
            className="min-w-0 flex-1 truncate bg-transparent text-sm font-semibold outline-none"
          >
            {db.stores.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
            <option value="__new">+ New store…</option>
          </select>
        </div>
        <nav className="flex-1 space-y-0.5 p-2" aria-label="Dashboard">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cx("flex items-center gap-3 rounded-md px-3 py-2 text-sm", active ? "bg-surface font-medium text-text" : "text-muted hover:bg-surface hover:text-text")}>
                <Icon className="h-4 w-4" aria-hidden /> {label}
                {label === "Orders" && store.orders.filter((o) => o.status === "paid").length > 0 && (
                  <span className="ml-auto rounded-full bg-accent px-1.5 text-[10px] font-semibold text-on-accent">{store.orders.filter((o) => o.status === "paid").length}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-border p-3">
          <Link href={`/store/${store.slug}`} target="_blank" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-surface hover:text-text">
            <ExternalLink className="h-4 w-4" /> View storefront
          </Link>
          <Link href="/create" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-surface hover:text-text">
            <Plus className="h-4 w-4" /> New store
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-bg/90 px-4 backdrop-blur sm:px-6">
          <div className="flex gap-1 overflow-x-auto md:hidden">
            {NAV.slice(0, 5).map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} aria-label={label} className={cx("rounded-md p-2", pathname === href ? "bg-surface" : "text-muted")}><Icon className="h-4 w-4" /></Link>
            ))}
          </div>
          <div className="hidden truncate text-sm text-muted md:block">{store.name}</div>
          <Badge tone={store.published ? "success" : "warning"}>{store.published ? "Live" : "Hidden"}</Badge>
          <button onClick={() => palette.setOpen(true)} className="ml-auto hidden items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:bg-surface sm:flex" aria-label="Open command palette">
            Jump to… <kbd className="rounded border border-border px-1 text-[10px]">⌘K</kbd>
          </button>
          <button onClick={() => setChatOpen((v) => !v)} aria-expanded={chatOpen} className={cx("ml-auto flex items-center gap-2 rounded-md px-3 py-1.5 text-sm sm:ml-0", chatOpen ? "bg-accent text-on-accent" : "border border-border hover:bg-surface")}>
            <Bot className="h-4 w-4" /> Assistant
          </button>
        </header>
        <div className="flex flex-1">
          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          {chatOpen && <AssistantPanel onClose={() => setChatOpen(false)} />}
        </div>
      </div>
      {palette.open && <CommandPalette onClose={() => palette.setOpen(false)} />}
    </div>
  );
}

type Msg = { role: "user" | "assistant"; text: string; action?: AssistantAction; done?: "applied" | "dismissed" };

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

  const send = (text: string) => {
    if (!text.trim() || thinking) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const r = assistant(text, store, page.toLowerCase());
      setMsgs((m) => [...m, { role: "assistant", text: r.text, action: r.action }]);
      setThinking(false);
    }, 600);
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
        <p className="mt-2 text-[11px] text-muted">Demo assistant — rules-based, no AI model is called.</p>
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

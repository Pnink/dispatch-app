"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";
import { downloadBackup, setCurrentStore, updateStore, useCurrentStore, useDB } from "@/lib/store";
import type { Apps } from "@/lib/types";
import { cx } from "@/lib/format";

type Cmd = { id: string; group: string; label: string; hint?: string; run: () => void };

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const store = useCurrentStore()!;
  const db = useDB();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const go = (href: string) => () => router.push(href);
  const toggle = (k: keyof Apps, label: string): Cmd => ({
    id: `app-${k}`,
    group: "Switches",
    label: `${store.apps[k] ? "Turn off" : "Turn on"} ${label}`,
    run: () => updateStore(store.slug, (s) => ({ ...s, apps: { ...s.apps, [k]: !s.apps[k] } })),
  });

  const cmds: Cmd[] = useMemo(
    () => [
      { id: "home", group: "Go to", label: "Today", run: go("/dashboard") },
      { id: "orders", group: "Go to", label: "Orders", run: go("/dashboard/orders") },
      { id: "ship", group: "Go to", label: "Orders to ship", run: go("/dashboard/orders") },
      { id: "products", group: "Go to", label: "Products", run: go("/dashboard/products") },
      { id: "apps", group: "Go to", label: "Built-in apps", run: go("/dashboard/apps") },
      { id: "email", group: "Go to", label: "Email flows", run: go("/dashboard/email") },
      { id: "exp", group: "Go to", label: "Experiments (A/B tests)", run: go("/dashboard/experiments") },
      { id: "design", group: "Go to", label: "Design & homepage sections", run: go("/dashboard/design") },
      { id: "settings", group: "Go to", label: "Settings", run: go("/dashboard/settings") },
      { id: "store", group: "Go to", label: "Open storefront", hint: "new tab", run: () => window.open(`/store/${store.slug}`, "_blank") },
      { id: "new-store", group: "Create", label: "New store", run: go("/create") },
      toggle("popup", "email popup"),
      toggle("reviews", "reviews"),
      toggle("email", "email marketing"),
      toggle("loyalty", "loyalty points"),
      {
        id: "publish",
        group: "Switches",
        label: store.published ? "Hide storefront (unpublish)" : "Publish storefront",
        run: () => updateStore(store.slug, (s) => ({ ...s, published: !s.published })),
      },
      { id: "backup", group: "Data", label: "Download full backup", hint: ".json", run: () => downloadBackup() },
      ...db.stores
        .filter((s) => s.slug !== store.slug)
        .map((s) => ({ id: `switch-${s.slug}`, group: "Switch store", label: s.name, run: () => setCurrentStore(s.slug) })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, db],
  );

  const shown = cmds.filter((c) => `${c.group} ${c.label}`.toLowerCase().includes(q.toLowerCase()));
  const run = (c: Cmd) => {
    onClose();
    c.run();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-[12vh]" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Command palette" className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-bg shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setI(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setI((x) => Math.min(shown.length - 1, x + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setI((x) => Math.max(0, x - 1));
              } else if (e.key === "Enter" && shown[i]) {
                run(shown[i]);
              } else if (e.key === "Escape") onClose();
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-list"
            aria-activedescendant={shown[i] ? `cmd-${shown[i].id}` : undefined}
            placeholder="Type a command or page…"
            className="h-12 flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="rounded border border-border px-1.5 text-[10px] text-muted">esc</kbd>
        </div>
        <ul id="cmd-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No matching commands.</li>}
          {shown.map((c, k) => (
            <li
              key={c.id}
              id={`cmd-${c.id}`}
              role="option"
              aria-selected={k === i}
              onMouseEnter={() => setI(k)}
              onClick={() => run(c)}
              className={cx("flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm", k === i && "bg-surface")}
            >
              <span>
                <span className="mr-2 text-xs text-muted">{c.group}</span>
                {c.label}
              </span>
              {k === i ? <CornerDownLeft className="h-3.5 w-3.5 text-muted" aria-hidden /> : c.hint && <span className="text-xs text-muted">{c.hint}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

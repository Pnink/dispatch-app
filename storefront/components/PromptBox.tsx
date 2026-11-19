"use client";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { CATEGORY_CHIPS } from "@/lib/ai";
import { Chip } from "./ui";

export function PromptBox({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const id = useId();
  const go = (prompt: string, category?: string) => {
    const q = new URLSearchParams({ prompt });
    if (category) q.set("category", category);
    router.push(`/create?${q}`);
  };
  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) go(text.trim());
        }}
        className="relative rounded-xl border border-border bg-bg p-3 text-left shadow-pop"
      >
        <label htmlFor={id} className="sr-only">Describe your store idea</label>
        <textarea
          id={id}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (text.trim()) go(text.trim());
            }
          }}
          placeholder="Describe your store idea — what you sell, who it's for, and the vibe…"
          className="w-full resize-none bg-transparent p-1 text-base text-text outline-none placeholder:text-muted"
        />
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-muted"><Sparkles className="h-3.5 w-3.5" aria-hidden /> Generates a full store in about a minute</span>
          <button type="submit" disabled={!text.trim()} aria-label="Generate store" className="grid h-9 w-9 place-items-center rounded-full bg-ink text-on-ink disabled:opacity-30">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {CATEGORY_CHIPS.slice(0, 4).map((c) => (
          <Chip key={c.label} onClick={() => go(c.prompt, c.category)} className={dark ? "border-white/20 bg-white/5 text-on-ink hover:border-white/40" : ""}>
            {c.label}
          </Chip>
        ))}
        <Chip onClick={() => router.push("/create")} className={dark ? "border-white/20 bg-white/5 text-on-ink hover:border-white/40" : ""}>
          Start from scratch
        </Chip>
      </div>
    </div>
  );
}

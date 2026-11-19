"use client";
/** Browser side of the AI features. All model calls go through the owner-only server route; keys stay on the server. */
import { useEffect, useSyncExternalStore } from "react";
import type { AssistantReplyJson, GeneratedJson } from "./ai-actions";
import { storeContext } from "./ai-actions";
import type { Store } from "./types";

export type AiSettings = {
  aiModel: string;
  keys: { anthropic: boolean; openai: boolean };
  extra: { anthropic: string[]; openai: string[] };
  available: { anthropic: string[]; openai: string[] };
};

let settings: AiSettings | null = null;
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Load once; callers that arrive while it's loading wait for the same request. */
function load(force = false): Promise<void> {
  if (settings && !force) return Promise.resolve();
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const r = await fetch("/api/admin/ai", { cache: "no-store" });
      if (r.ok) settings = await r.json();
    } catch {
      /* stays null: callers fall back to the built-in rules */
    } finally {
      inFlight = null;
      emit();
    }
  })();
  return inFlight;
}

export function useAiSettings(): AiSettings | null {
  const s = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => settings,
    () => null,
  );
  useEffect(() => {
    load();
  }, []);
  return s;
}

export async function setAiModel(aiModel: string) {
  const r = await fetch("/api/admin/ai", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ aiModel }) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Couldn't save the model.");
  if (settings) settings = { ...settings, aiModel };
  emit();
}

export const aiModel = () => settings?.aiModel ?? "builtin";
export async function ensureAiSettings() {
  await load();
  return settings;
}

type Ok<T> = { ok: true; label: string; data: T };
type Err = { ok: false; error: string };

async function post<T>(payload: unknown): Promise<Ok<T> | Err> {
  try {
    const r = await fetch("/api/admin/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: d.error || `AI request failed (${r.status}).` };
    return { ok: true, label: d.label, data: d as T };
  } catch {
    return { ok: false, error: "Couldn't reach the app's server." };
  }
}

export function askAssistant(store: Store, page: string, history: { role: "user" | "assistant"; content: string }[]) {
  return post<AssistantReplyJson>({ task: "assistant", store: storeContext(store), page, history });
}

export async function generateWithAi(prompt: string, category?: string, images: string[] = []) {
  const r = await post<{ store: GeneratedJson }>({ task: "generate", prompt, category, images });
  return r.ok ? { ok: true as const, label: r.label, store: r.data.store } : r;
}

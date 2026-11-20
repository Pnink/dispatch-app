/**
 * File-backed database for a single owner. Everything is saved to DATA_DIR/db.json (default ./data):
 * - writes are atomic (write a temp file, then rename), so a crash never leaves half a file
 * - writes are serialised through one queue, so two requests can't interleave
 * - every save bumps `rev`, so a stale editor can't overwrite newer data (409 instead)
 * - a timestamped copy goes to DATA_DIR/backups at most every 10 minutes; the newest 50 are kept
 */
import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { withDefaults } from "../sections";
import type { Store } from "../types";

export type DB = { rev: number; savedAt: string; stores: Store[] };

const DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), "data"));
const FILE = path.join(DIR, "db.json");
const BACKUPS = path.join(DIR, "backups");
const BACKUP_EVERY_MS = 10 * 60 * 1000;
const KEEP_BACKUPS = 50;

let cache: DB | null = null;
let queue: Promise<unknown> = Promise.resolve();
let lastBackup = 0;

async function load(): Promise<DB> {
  if (cache) return cache;
  try {
    const raw = JSON.parse(await fs.readFile(FILE, "utf8")) as DB;
    cache = { rev: raw.rev ?? 1, savedAt: raw.savedAt ?? new Date().toISOString(), stores: (raw.stores ?? []).map(withDefaults) };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; // corrupt file: refuse to start empty and overwrite it
    cache = { rev: 0, savedAt: new Date().toISOString(), stores: [] };
  }
  return cache;
}

async function persist(db: DB) {
  await fs.mkdir(DIR, { recursive: true, mode: 0o700 });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 1), { mode: 0o600 });
  await fs.rename(tmp, FILE);
  if (Date.now() - lastBackup > BACKUP_EVERY_MS) {
    lastBackup = Date.now();
    await fs.mkdir(BACKUPS, { recursive: true, mode: 0o700 });
    await fs.copyFile(FILE, path.join(BACKUPS, `db-${db.savedAt.replace(/[:.]/g, "-")}.json`));
    const old = (await fs.readdir(BACKUPS)).filter((f) => f.endsWith(".json")).sort().slice(0, -KEEP_BACKUPS);
    await Promise.all(old.map((f) => fs.unlink(path.join(BACKUPS, f))));
  }
}

/** Run one read-modify-write at a time. */
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

export async function readDB(): Promise<DB> {
  return serial(load);
}

/** Replace everything (owner autosave). Fails with "conflict" if someone saved since baseRev. */
export async function replaceDB(stores: Store[], baseRev: number, force = false): Promise<{ ok: true; db: DB } | { ok: false; db: DB }> {
  return serial(async () => {
    const db = await load();
    if (!force && baseRev !== db.rev) return { ok: false as const, db };
    const next: DB = { rev: db.rev + 1, savedAt: new Date().toISOString(), stores: stores.map(withDefaults) };
    await persist(next);
    cache = next;
    return { ok: true as const, db: next };
  });
}

/** Change one store (shopper actions). The callback may return an error string to abort. */
export async function updateStoreOnServer<T>(slug: string, fn: (s: Store) => Promise<{ store: Store; result: T } | string>): Promise<{ ok: true; result: T } | { ok: false; error: string; status: number }> {
  return serial(async () => {
    const db = await load();
    const store = db.stores.find((s) => s.slug === slug);
    if (!store) return { ok: false as const, error: "Store not found.", status: 404 };
    const out = await fn(store);
    if (typeof out === "string") return { ok: false as const, error: out, status: 400 };
    const next: DB = { rev: db.rev + 1, savedAt: new Date().toISOString(), stores: db.stores.map((s) => (s.slug === slug ? out.store : s)) };
    await persist(next);
    cache = next;
    return { ok: true as const, result: out.result };
  });
}

// ---------- owner settings (DATA_DIR/settings.json) ----------
export type Settings = { aiModel: string };
const SETTINGS = path.join(DIR, "settings.json");
const DEFAULT_SETTINGS: Settings = { aiModel: "auto" }; // auto = free rules until you add a key, then picks per request

export async function readSettings(): Promise<Settings> {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(await fs.readFile(SETTINGS, "utf8")) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function writeSettings(patch: Partial<Settings>): Promise<Settings> {
  return serial(async () => {
    const next = { ...(await readSettings()), ...patch };
    await fs.mkdir(DIR, { recursive: true, mode: 0o700 });
    const tmp = `${SETTINGS}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(next, null, 1), { mode: 0o600 });
    await fs.rename(tmp, SETTINGS);
    return next;
  });
}

// ---------- AI practice-test history (DATA_DIR/evals.json, newest first, last 30 runs) ----------
export type EvalRun = { at: string; model: string; label: string; average: number; review: boolean; cases: { name: string; score: number; failures: string[]; issues: string[] }[] };
const EVALS = path.join(DIR, "evals.json");

export async function readEvals(): Promise<EvalRun[]> {
  try {
    return JSON.parse(await fs.readFile(EVALS, "utf8"));
  } catch {
    return [];
  }
}

export async function addEval(run: EvalRun) {
  return serial(async () => {
    const next = [run, ...(await readEvals())].slice(0, 30);
    await fs.mkdir(DIR, { recursive: true, mode: 0o700 });
    const tmp = `${EVALS}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(next, null, 1), { mode: 0o600 });
    await fs.rename(tmp, EVALS);
  });
}

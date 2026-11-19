/** The owner's whole database. Protected by middleware (owner session or localhost). */
import type { NextRequest } from "next/server";
import { readDB, replaceDB } from "@/lib/server/db";
import { body, json, sameOrigin } from "@/lib/server/http";
import type { Store } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await readDB();
  return json(db);
}

export async function PUT(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: "Bad origin." }, 403);
  const b = await body<{ baseRev?: number; stores?: Store[]; force?: boolean }>(req, 25_000_000);
  if (!b || !Array.isArray(b.stores) || typeof b.baseRev !== "number") return json({ error: "Bad request." }, 400);
  if (b.stores.some((s) => !s || typeof s.slug !== "string" || !/^[a-z0-9-]{1,80}$/.test(s.slug) || typeof s.name !== "string" || !Array.isArray(s.products)))
    return json({ error: "Invalid store data." }, 400);
  const out = await replaceDB(b.stores, b.baseRev, !!b.force);
  return out.ok ? json({ rev: out.db.rev, savedAt: out.db.savedAt }) : json({ error: "conflict", ...out.db }, 409);
}

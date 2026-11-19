import "server-only";
import { NextResponse, type NextRequest } from "next/server";

/** Browsers send Origin on cross-site POST/PUT. Reject writes that come from another site (CSRF). */
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches from some browsers / curl from this machine
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });

/** Read a JSON body with a size cap. */
export async function body<T = unknown>(req: NextRequest, maxBytes: number): Promise<T | null> {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > maxBytes) return null;
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// ---------- rate limiting (per process, per client IP) ----------
const hits = new Map<string, { n: number; reset: number }>();
export function clientIp(req: NextRequest) {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}
/** true if allowed */
export function rateLimit(bucket: string, req: NextRequest, max: number, windowMs: number) {
  const k = `${bucket}:${clientIp(req)}`;
  const now = Date.now();
  const h = hits.get(k);
  if (!h || h.reset < now) {
    hits.set(k, { n: 1, reset: now + windowMs });
    if (hits.size > 10_000) for (const [key, v] of hits) if (v.reset < now) hits.delete(key);
    return true;
  }
  h.n++;
  return h.n <= max;
}

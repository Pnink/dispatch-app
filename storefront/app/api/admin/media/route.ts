/** Owner-only photo upload (middleware protects /api/admin). Body: the raw image bytes. */
import type { NextRequest } from "next/server";
import { MAX_BYTES, saveMedia } from "@/lib/server/media";
import { json, rateLimit, sameOrigin } from "@/lib/server/http";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: "Bad origin." }, 403);
  if (!rateLimit("upload", req, 60, 60_000)) return json({ error: "Too many uploads at once." }, 429);
  if (Number(req.headers.get("content-length") || 0) > MAX_BYTES) return json({ error: "That photo is too large (10 MB max)." }, 413);
  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length > MAX_BYTES) return json({ error: "That photo is too large (10 MB max)." }, 413);
  const id = await saveMedia(buf);
  return id ? json({ id }) : json({ error: "Use a JPG, PNG, WebP or GIF photo." }, 415);
}

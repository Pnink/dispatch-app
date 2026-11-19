/** Serves product photos to anyone (they're shown on the storefront). */
import { readMedia } from "@/lib/server/media";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await readMedia(id);
  if (!m) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(m.buf), {
    headers: {
      "content-type": m.type,
      "cache-control": "public, max-age=31536000, immutable", // ids are random and never reused
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'",
    },
  });
}

/** What any shopper's browser may read about a store. */
import { readDB } from "@/lib/server/db";
import { json } from "@/lib/server/http";
import { publicView } from "@/lib/commerce";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = (await readDB()).stores.find((s) => s.slug === slug);
  if (!store) return json({ error: "Store not found." }, 404);
  if (!store.published) return json({ published: false, name: store.name, palette: store.palette, font: store.font });
  return json(publicView(store));
}

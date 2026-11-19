import type { Metadata } from "next";
import { StoreShell } from "./StoreShell";

/**
 * White-label: storefront pages never carry the platform name, not even in the first HTML.
 * Store data lives client-side for now, so the server titles the page from its address
 * ("linden-and-clay" -> "Linden And Clay"); the client then sets the exact name.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-\d+$/, "").split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return { title: { absolute: name }, description: `Shop ${name}.`, icons: { icon: [] } };
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}

"use client";
import { useParams } from "next/navigation";
import { useShopperStore } from "@/lib/store";
import { StoreHome } from "@/components/storefront";

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const store = useShopperStore(slug);
  if (!store) return null;
  return <StoreHome store={store} base={`/store/${store.slug}`} />;
}

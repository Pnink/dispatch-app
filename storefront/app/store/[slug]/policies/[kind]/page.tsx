"use client";
import { notFound, useParams } from "next/navigation";
import { useShopperStore } from "@/lib/store";
import { isPolicyKind, POLICY_TITLE, policyText } from "@/lib/policies";
import { cx } from "@/lib/format";
import { headingFont } from "@/components/storefront";

export default function PolicyPage() {
  const { slug, kind } = useParams<{ slug: string; kind: string }>();
  const store = useShopperStore(slug);
  if (!isPolicyKind(kind)) notFound();
  if (!store) return null;
  const blocks = policyText(kind, store).split(/\n\s*\n|\n(?=## )/);
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className={cx("text-4xl", headingFont(store))}>{POLICY_TITLE[kind]}</h1>
      <div className="mt-8 space-y-4 leading-relaxed">
        {blocks.map((b, i) => {
          const [first, ...rest] = b.trim().split("\n");
          if (first.startsWith("## "))
            return (
              <section key={i}>
                <h2 className="mt-6 text-lg font-semibold">{first.slice(3)}</h2>
                {rest.length > 0 && <p className="mt-2 opacity-80">{rest.join(" ")}</p>}
              </section>
            );
          return <p key={i} className="opacity-80">{b.trim()}</p>;
        })}
      </div>
    </article>
  );
}

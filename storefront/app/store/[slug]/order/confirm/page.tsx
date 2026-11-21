"use client";
/** Stripe sends the shopper here after paying. We ask the server (which asks Stripe) before showing "thank you". */
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { confirmCheckout, useShopperStore } from "@/lib/store";
import { cx } from "@/lib/format";
import { headingFont } from "@/components/storefront";

export default function ConfirmPage() {
  return (
    <Suspense>
      <Confirm />
    </Suspense>
  );
}

function Confirm() {
  const { slug } = useParams<{ slug: string }>();
  const session = useSearchParams().get("session_id") ?? "";
  const router = useRouter();
  const store = useShopperStore(slug);
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !session) return;
    started.current = true;
    (async () => {
      // the webhook may record it a moment later than the redirect: retry briefly
      for (let i = 0; i < 4; i++) {
        const r = await confirmCheckout(slug, session);
        if (r.ok && "order" in r) return router.replace(`/store/${slug}/order/${r.order.id}`);
        if (!r.ok && !/hasn't gone through/.test(r.error)) return setError(r.error);
        await new Promise((res) => setTimeout(res, 1500));
      }
      setError("Your payment is still processing. You'll get an email when it's confirmed.");
    })();
  }, [session, slug, router]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      {error ? (
        <>
          <h1 className={cx("text-3xl", store && headingFont(store))}>Almost there</h1>
          <p className="mt-4 opacity-75" role="alert">{error}</p>
          <Link href={`/store/${slug}`} className="mt-6 inline-block underline">Back to the shop</Link>
        </>
      ) : (
        <>
          <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          <p className="mt-4 opacity-75">Confirming your payment…</p>
        </>
      )}
    </div>
  );
}

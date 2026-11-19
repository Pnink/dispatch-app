import type { Metadata } from "next";
import { FlaskConical, Globe2, Search, Sparkles, Users, Wrench } from "lucide-react";
import { LinkButton } from "@/components/ui";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-4 pb-12 pt-20 text-center sm:px-6">
        <p className="text-sm font-medium text-accent">About this project</p>
        <h1 className="mt-3 font-display text-5xl sm:text-6xl">Running a shop shouldn&apos;t need a stack of tools</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          Forgecart is a personal demo exploring a simple idea: if the storefront, the back office and an assistant all share one system, a single
          person can launch and run a brand without hiring an agency or wiring up a dozen apps.
        </p>
        <LinkButton href="/create" size="lg" className="mt-8">Try it</LinkButton>
      </section>

      <section className="mx-auto grid max-w-4xl gap-5 px-4 sm:grid-cols-2 sm:px-6">
        {[
          ["1 admin", "Storefront, catalog, orders, email and settings live in one place."],
          ["1 assistant", "It can see the page you are on and propose real changes, which you approve."],
        ].map(([big, small]) => (
          <div key={big} className="rounded-xl border border-border bg-surface p-8">
            <div className="font-display text-5xl">{big}</div>
            <p className="mt-3 text-muted">{small}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <h2 className="text-center font-display text-4xl">Commerce for people, not platforms</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {[
            [Sparkles, "Hands-off", "Generate the first version, then steer it with plain language."],
            [Wrench, "Everything included", "No plugins to evaluate, pay for or keep compatible."],
            [Users, "For one or for a team", "Start solo and grow into several storefronts later."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Sparkles;
            return (
              <div key={t as string} className="text-center">
                <I className="mx-auto h-6 w-6 text-accent" aria-hidden />
                <h3 className="mt-3 font-semibold">{t as string}</h3>
                <p className="mt-2 text-sm text-muted">{d as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-ink py-20 text-on-ink">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="font-display text-4xl">What the platform does</h2>
          <p className="mt-3 max-w-2xl text-on-ink/70">Store builder · experiments · search visibility · bundles · subscriptions · pricing suggestions · several storefronts · promotions · checkout tuning</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              [FlaskConical, "Tests while you sleep", "Headlines, offers and thresholds get tested automatically; weak variants are dropped and strong ones roll out."],
              [Search, "Easy to discover", "Search-ready pages and conversion improvements come as standard, not as an add-on."],
              [Globe2, "Many audiences, one catalog", "Run storefronts tuned for different markets or channels from a single set of products."],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof Sparkles;
              return (
                <div key={t as string} className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <I className="h-5 w-5" aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold">{t as string}</h3>
                  <p className="mt-2 text-sm text-on-ink/70">{d as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
        <blockquote className="font-display text-3xl leading-snug">&ldquo;The best tool for a small brand is the one that does the work, not the one that shows you a dashboard about the work.&rdquo;</blockquote>
        <p className="mt-4 text-sm text-muted">— the idea behind this demo</p>
        <LinkButton href="/create" size="lg" className="mt-10">Start your store</LinkButton>
      </section>
    </>
  );
}

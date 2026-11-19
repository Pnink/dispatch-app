import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "FAQ" };

const SECTIONS: { id: string; title: string; qs: [string, React.ReactNode][] }[] = [
  {
    id: "basics",
    title: "The basics",
    qs: [
      ["What is this?", "A store platform you own: describe a shop, get a finished storefront, and run it from a dashboard with an assistant, A/B tests and built-in apps. It's a private build for one owner — there are no plans or accounts to buy."],
      ["What does it cost?", <>Nothing for the software. Running a real store has outside costs — card processing, hosting, a domain. <Link href="/costs" className="underline">The Costs page</Link> lays them out with a calculator.</>],
      ["Is any feature locked?", "No. The assistant, experiments, reviews, popups, email flows and loyalty points are all on, for every store, with no limits on products or orders."],
      ["Can I run more than one store?", "Yes, as many as you like. Switch between them from the dashboard sidebar or with ⌘K."],
    ],
  },
  {
    id: "customers",
    title: "Your customers",
    qs: [
      ["Will shoppers know what platform I use?", "No. Storefronts show your store name in the browser tab, your own favicon, your colours, and no “powered by” line or platform link anywhere — not in the page, the footer, checkout or order pages."],
      ["Do shoppers need an account?", "No. Guest checkout is the default."],
      ["What do they see that I don't want them to?", "Nothing. The small dark owner bar at the top of a storefront only shows in your own browser (the one you use the dashboard in)."],
    ],
  },
  {
    id: "real",
    title: "Running it for real",
    qs: [
      ["Can I sell real things on it today?", "Not yet. Right now everything is stored in your browser and payments are simulated. To take real orders it needs three things: real payments (Stripe), a real database, and hosting on your own domain. Each is a well-understood step — see the next answers."],
      ["What would real payments need?", "A Stripe account (free to open). Your bank details go into Stripe, never into this app; Stripe pays you out. The app only needs your Stripe API keys, and test mode works with no bank or ID at all."],
      ["Where would it be hosted?", "Any host that runs Next.js. Check that the plan you pick allows commercial use — some free tiers don't."],
      ["Is it safe to run my real store on it?", "Once it's on a real database and real payments, with backups, yes — that's the same setup most independent stores use. Card numbers are handled entirely by the payment processor, never by your server."],
    ],
  },
  {
    id: "payments",
    title: "Payments in this build",
    qs: [
      ["How do I test checkout?", "Use 4242 4242 4242 4242 with any future expiry and any CVC. 4000 0000 0000 0002 shows a decline; 4000 0000 0000 9995 shows insufficient funds. Wallet buttons are simulated."],
      ["Do discount codes work?", "Yes. Create them in Settings, or ask the assistant for “a 15% discount”. The popup can hand one out automatically."],
    ],
  },
  {
    id: "data",
    title: "Your data",
    qs: [
      ["Can I get everything out?", "Yes — Settings → Your data. A full JSON backup of every store, plus orders, products and your email list as CSV files any other platform can import."],
      ["How do I move to another computer?", "Download a full backup on the old one and restore it on the new one, from the same screen."],
      ["What happens if I clear my browser?", "In this build, the data goes with it. Download a backup first. A real database removes this problem."],
    ],
  },
  {
    id: "later",
    title: "Later",
    qs: [
      ["Could this become an app other people pay for?", "Possibly, down the line. That would need accounts, billing, multi-tenant data and a lot of hardening. It's deliberately out of scope until your own store runs well on it."],
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <h1 className="font-display text-5xl">Straight answers</h1>
      <p className="mt-4 max-w-xl text-muted">How it works, what it costs, what your customers see, and what it still needs before you sell real things on it.</p>

      <nav aria-label="FAQ sections" className="mt-8 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-border-input">{s.title}</a>
        ))}
      </nav>

      <div className="mt-14 space-y-12">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="text-2xl font-semibold">{s.title}</h2>
            <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-bg">
              {s.qs.map(([q, a]) => (
                <details key={q} className="group px-5 py-4">
                  <summary className="flex items-center justify-between gap-4 font-medium">
                    {q}
                    <Plus className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-45" aria-hidden />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section id="contact" className="mt-20 scroll-mt-24 rounded-xl border border-border bg-surface p-6 sm:p-10">
        <h2 className="font-display text-3xl">Notes to self</h2>
        <p className="mt-2 text-sm text-muted">A scratch form for ideas and bugs. (Nothing is sent anywhere yet.)</p>
        <ContactForm />
      </section>
    </div>
  );
}

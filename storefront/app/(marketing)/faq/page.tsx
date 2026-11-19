import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "FAQ" };

const SECTIONS: { id: string; title: string; qs: [string, string][] }[] = [
  {
    id: "getting-started",
    title: "Getting started",
    qs: [
      ["What is Forgecart?", "A hosted commerce platform where the storefront, the back office and an AI assistant share one system. You describe a store; it builds it and then helps you run it."],
      ["How do I create a store?", "Write one sentence about what you want to sell (or tap a category). The assistant picks a name, palette and layout, writes a handful of products with imagery, and gives you a preview to review."],
      ["Do I need to be technical?", "No. There are no themes to install, no DNS to wrangle and no plugins to stitch together. If you do like code, you can add your own CSS and HTML blocks."],
      ["Can I try it for free?", "Yes. You can build and preview a complete store without a card. You only choose a plan when you want to take real orders on your own domain."],
      ["Do I need extra apps?", "Reviews, an email-capture popup, email flows and a loyalty programme are built in — each is a single switch in the dashboard."],
    ],
  },
  {
    id: "building",
    title: "Building your store",
    qs: [
      ["How do I change the design?", "Ask the assistant (\"make the accent green\", \"go darker\", \"new homepage headline\") or edit settings directly. Changes appear in the preview straight away."],
      ["Can I edit every page?", "Home, product, cart and checkout pages are all editable, along with landing pages for launches and promotions."],
      ["Will it work on phones?", "Every storefront is designed mobile-first and tested at phone and desktop sizes."],
      ["Can I use my own logo and colours?", "Yes — upload a logo and set exact colours, or describe a mood and let the assistant propose a palette."],
    ],
  },
  {
    id: "products",
    title: "Products & inventory",
    qs: [
      ["How do I add a product?", "Type a product name and the assistant drafts the description, price, variants and search title. Edit anything before saving, or add products manually."],
      ["Do you support variants?", "Yes. Sizes, colours or any option you like, each selectable by the shopper."],
      ["How is stock tracked?", "Stock goes down as orders come in and back up when you refund. The assistant warns you when something is running low."],
      ["Can I import from another platform?", "CSV import and assisted migration are on the roadmap for this demo; the production version would map products, customers and orders across."],
    ],
  },
  {
    id: "payments",
    title: "Payments & checkout",
    qs: [
      ["Which payment methods can shoppers use?", "Cards plus popular wallets and local methods. In this demo all payments are simulated — use 4242 4242 4242 4242 to succeed or 4000 0000 0000 0002 to see a decline."],
      ["Do shoppers need an account?", "No. Guest checkout is the default."],
      ["Do you take a cut of sales?", "No platform fee. Card processing is charged at the processor's rate."],
      ["Can I offer discount codes?", "Yes. Create codes in the dashboard or just ask the assistant for \"a 15% discount\"."],
    ],
  },
  {
    id: "shipping",
    title: "Shipping & fulfilment",
    qs: [
      ["How do shipping rates work?", "Each store has a flat rate and a free-shipping threshold, both editable. Shoppers see a progress bar towards free shipping in the cart."],
      ["How do I fulfil an order?", "Open Orders, choose the order and mark it fulfilled. Refunds put stock back automatically."],
      ["Do you integrate with carriers?", "Live carrier rates and label printing are out of scope for this demo."],
    ],
  },
  {
    id: "migration",
    title: "Moving from another platform",
    qs: [
      ["Can I bring my existing store?", "The full product would import products, customers, order history, redirects and discount codes. This demo starts every store fresh."],
      ["Will I lose search rankings?", "A proper migration keeps URLs or adds permanent redirects so search engines follow along."],
      ["How long does a move take?", "Most small catalogues move in a day or two; very large ones take longer."],
    ],
  },
  {
    id: "ai",
    title: "AI & automation",
    qs: [
      ["What can the assistant actually do?", "Answer questions about your store, and propose actions — create discounts, add products, restock, refund orders, restyle the storefront, write search titles. You approve each action with one click."],
      ["Does it act without asking?", "No. Every change is proposed first and applied only when you press the button."],
      ["Is this demo using a real AI model?", "No. The demo uses a deterministic, rules-based stand-in so it works offline with no API keys. The architecture is ready for a real model."],
    ],
  },
  {
    id: "domains",
    title: "Domains, email & SEO",
    qs: [
      ["Can I use my own domain?", "In production, yes, with automatic SSL. In this demo each store lives at /store/your-store-name."],
      ["Which emails are sent?", "Welcome, abandoned checkout, post-purchase and review-request flows. In the demo you can preview and edit them; nothing is actually sent."],
      ["What about SEO?", "Every product has an editable search title, and the assistant can write them for you in bulk."],
    ],
  },
  {
    id: "billing",
    title: "Billing & plans",
    qs: [
      ["Which plan should I pick?", "Launch for a single store, Grow when you add a second brand or teammates, Scale for teams with several storefronts, and Enterprise for high volume."],
      ["Can I change plans later?", "Any time. Upgrades and downgrades are prorated."],
      ["Is yearly billing cheaper?", "Yes — 20% less than paying monthly."],
      ["What happens if I cancel?", "Your storefront is paused and your data is kept so you can export it."],
    ],
  },
  {
    id: "security",
    title: "Security & data",
    qs: [
      ["Where is demo data stored?", "Only in your browser's local storage. Clearing site data, or using Reset demo in the dashboard, wipes it."],
      ["Who owns my data?", "You do. It is never sold and never used to train models."],
      ["Can I give teammates limited access?", "Role-based permissions are part of the production plan; this demo has a single merchant."],
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <h1 className="font-display text-5xl">Questions, answered</h1>
      <p className="mt-4 max-w-xl text-muted">Everything about building, selling and running a store on Forgecart. Can&apos;t find it? Send us a note at the bottom.</p>

      <nav aria-label="FAQ categories" className="mt-8 flex flex-wrap gap-2">
        <span className="py-1.5 text-sm text-muted">Jump to:</span>
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-border-input">
            {s.title}
          </a>
        ))}
      </nav>

      <div className="mt-14 space-y-14">
        {SECTIONS.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="flex items-baseline gap-3 text-2xl font-semibold">
              <span className="font-mono text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
              {s.title}
            </h2>
            <div className="mt-4 divide-y divide-border rounded-xl border border-border">
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
        <h2 className="font-display text-3xl">Still have a question?</h2>
        <p className="mt-2 text-sm text-muted">Drop us a line and we&apos;ll reply within one business day. (Demo: messages aren&apos;t sent anywhere.)</p>
        <ContactForm />
      </section>
    </div>
  );
}

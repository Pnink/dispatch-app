/**
 * Rule checks every specialist answer goes through (AI or free rules), before the owner sees it.
 * Small problems are fixed automatically (too long, unknown product); risky ones are flagged.
 * A second, AI-based review runs on the server when a model is selected (see server/specialist.ts).
 */
import type { Context, SpecialistId } from "./specialists";

export type Issue = { level: "fixed" | "warning" | "blocked"; text: string };
export type Checked<T> = { output: T; issues: Issue[] };

// Claims that need proof the store doesn't have, fake social proof and fake urgency.
const RISKY: [RegExp, string][] = [
  [/\b(cures?|heals?|treats?|prevents?|clinically|fda|dermatologist[- ]tested|hypoallergenic|non[- ]toxic|detox)\b/i, "health or safety claim"],
  [/\b(best[- ]selling|#\s?1|number one|world'?s (best|finest)|award[- ]winning|best in (the )?(world|class))\b/i, "unverifiable superlative"],
  [/\b(\d[\d,]*\+?\s*(happy |satisfied )?customers|five[- ]star|5[- ]star|rated \d|thousands of (happy )?customers|as seen (in|on))\b/i, "invented social proof"],
  [/\b(only \d+ left|selling fast|ends (tonight|today|soon)|last chance|hurry|limited time)\b/i, "fake urgency"],
  [/\b(guarantee[ds]?|risk[- ]free|100% (natural|organic|safe))\b/i, "promise the store may not make"],
];

const scan = (text: string, where: string): Issue[] =>
  RISKY.filter(([re]) => re.test(text)).map(([, what]) => ({ level: "warning" as const, text: `${where}: possible ${what} — check it's true before using.` }));

const clip = (s: string, n: number, issues: Issue[], label: string) => {
  const t = (s ?? "").trim();
  if (t.length <= n) return t;
  issues.push({ level: "fixed", text: `${label} shortened to ${n} characters.` });
  const cut = t.slice(0, n);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), n - 12)).replace(/[\s,;:—–-]+$/, "");
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function check(id: SpecialistId, raw: any, ctx: Context): Checked<any> {
  const issues: Issue[] = [];
  const ids = new Set(ctx.products.map((p) => p.id));
  const codes = new Set(ctx.discounts.map((d) => d.code.toUpperCase()));
  const mentionsUnknownCode = (text: string) => (text.match(/\b[A-Z][A-Z0-9]{3,}\d+\b/g) || []).filter((c) => !codes.has(c));

  switch (id) {
    case "product_copy": {
      const o = {
        title: clip(raw.title, 80, issues, "Title"),
        description: clip(raw.description, 700, issues, "Description"),
        bullets: (Array.isArray(raw.bullets) ? raw.bullets : []).map((b: string) => clip(String(b), 120, issues, "A bullet")).filter(Boolean).slice(0, 6),
        seoTitle: clip(raw.seoTitle, 60, issues, "SEO title"),
        metaDescription: clip(raw.metaDescription, 160, issues, "Meta description"),
      };
      if (!o.title) issues.push({ level: "blocked", text: "No title was written." });
      if (o.bullets.length < 2) issues.push({ level: "warning", text: "Fewer than 2 key facts — add size, material or what's included." });
      issues.push(...scan(`${o.title} ${o.description} ${o.bullets.join(" ")} ${o.metaDescription}`, "Copy"));
      return { output: o, issues };
    }
    case "pricing": {
      const suggestions = (Array.isArray(raw.suggestions) ? raw.suggestions : []).filter((s: any) => {
        const p = ctx.products.find((x) => x.id === s.productId);
        if (!p) {
          issues.push({ level: "fixed", text: "Dropped a suggestion for a product that doesn't exist." });
          return false;
        }
        const ratio = s.suggestedCents / p.priceCents;
        if (!Number.isFinite(ratio) || s.suggestedCents < 100 || ratio < 0.5 || ratio > 2) {
          issues.push({ level: "fixed", text: `Dropped an extreme price for ${p.title} (more than half off or double).` });
          return false;
        }
        if (s.suggestedCents === p.priceCents) return false;
        if (s.confidence !== "high" && !s.testInstead) {
          s.testInstead = true;
          issues.push({ level: "fixed", text: `${p.title}: evidence isn't strong, so this became a test instead of a straight change.` });
        }
        return true;
      });
      return { output: { summary: String(raw.summary ?? ""), suggestions: suggestions.slice(0, 3), needToKnow: Array.isArray(raw.needToKnow) ? raw.needToKnow.slice(0, 5) : [] }, issues };
    }
    case "email": {
      const o = { subject: clip(raw.subject, 60, issues, "Subject"), preheader: clip(raw.preheader, 110, issues, "Preheader"), body: clip(raw.body, 1500, issues, "Body") };
      if (/[A-Z]{6,}/.test(o.subject)) issues.push({ level: "warning", text: "Subject has ALL CAPS — spam filters dislike that." });
      for (const c of mentionsUnknownCode(`${o.subject} ${o.body}`)) issues.push({ level: "blocked", text: `Mentions code ${c}, which doesn't exist in your store. Create it first or remove it.` });
      issues.push(...scan(`${o.subject} ${o.body}`, "Email"));
      return { output: o, issues };
    }
    case "experiments": {
      const running = new Set(ctx.experiments.filter((e) => e.status !== "completed").map((e) => e.kind));
      const ideas = (Array.isArray(raw.ideas) ? raw.ideas : []).filter((x: any) => {
        if (!["headline", "price", "free_shipping", "popup_offer"].includes(x.kind)) return false;
        if (x.kind === "price" && !ids.has(x.productId)) {
          issues.push({ level: "fixed", text: "Dropped a price test for an unknown product." });
          return false;
        }
        if (running.has(x.kind) && x.kind !== "price") {
          issues.push({ level: "fixed", text: `Dropped a ${x.kind.replace("_", " ")} test: one is already running.` });
          return false;
        }
        const n = Number(x.bValue);
        if (x.kind !== "headline" && (!Number.isFinite(n) || n < 0 || (x.kind === "popup_offer" && (n < 1 || n > 50)))) {
          issues.push({ level: "fixed", text: "Dropped a test with an invalid value." });
          return false;
        }
        if (x.kind === "headline") x.bValue = String(x.bValue).slice(0, 80);
        return true;
      });
      return { output: { ideas: ideas.slice(0, 3) }, issues };
    }
    case "seo": {
      const items = (Array.isArray(raw.items) ? raw.items : [])
        .filter((x: any) => ids.has(x.productId) || (issues.push({ level: "fixed", text: "Dropped SEO text for an unknown product." }), false))
        .map((x: any) => ({ productId: x.productId, seoTitle: clip(x.seoTitle, 60, issues, "An SEO title"), metaDescription: clip(x.metaDescription, 160, issues, "A meta description") }));
      items.forEach((x: any) => issues.push(...scan(`${x.seoTitle} ${x.metaDescription}`, "SEO text")));
      return { output: { items }, issues };
    }
    case "support": {
      const o = { reply: clip(raw.reply, 1500, issues, "Reply"), needsOwner: !!raw.needsOwner, reason: String(raw.reason ?? "").slice(0, 200) };
      if (/\[[^\]]+\]|\{\{|<name>|XXX/i.test(o.reply)) issues.push({ level: "blocked", text: "The reply has a placeholder left in it." });
      if (/\b(refund(ed)?|replacement|credit|compensat)/i.test(o.reply) && !o.needsOwner) {
        o.needsOwner = true;
        issues.push({ level: "fixed", text: "Mentions a refund or replacement, so it's flagged for you to approve." });
      }
      if (/\b(card number|cvv|password)\b/i.test(o.reply)) issues.push({ level: "blocked", text: "Asks for card or password details — never send this." });
      issues.push(...scan(o.reply, "Reply"));
      return { output: o, issues };
    }
  }
}

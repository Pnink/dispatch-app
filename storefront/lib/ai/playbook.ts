/**
 * The e-commerce playbook: written-down practice the specialists read before they work.
 * Plain, durable guidance — no made-up statistics. Each specialist gets only the sections it needs.
 * Edit freely: this file is where "e-commerce know-how" lives.
 */
export type PlaybookSection = "voice" | "product" | "pricing" | "email" | "testing" | "seo" | "support" | "honesty" | "merch";

export const PLAYBOOK: Record<PlaybookSection, string> = {
  honesty: `HONESTY RULES (never break these)
- Only state facts you were given (owner notes, product data, photos). If a detail is unknown (material, size, origin, care), leave it out — never guess.
- No invented reviews, ratings, testimonials, customer counts, awards, certifications, "as seen in", or statistics.
- No fake urgency or scarcity ("only 2 left", "ends tonight") unless the data says so. Stock numbers come from the data only.
- No "was $X" prices unless the product really sold at that price. No discounts the owner didn't create.
- No medical, health, weight-loss, safety or legal claims. No "cures", "heals", "clinically proven", "FDA approved", "non-toxic", "hypoallergenic" unless the owner provided proof.
- No unverifiable superlatives: "best", "#1", "world's finest", "perfect", "guaranteed".`,

  voice: `BRAND VOICE
- Write like a confident small-business owner talking to one customer: plain words, short sentences, concrete details.
- Lead with what the customer gets, not what the brand feels. Specific beats clever.
- Match the store's existing headline and story tone. Avoid buzzwords ("elevate", "curated", "unleash", "game-changer", "seamless").`,

  product: `PRODUCT PAGES THAT SELL
- Title: what it is + the one detail that matters (size, scent, material, count). Under 60 characters. No ALL CAPS, no keyword stuffing.
- First sentence answers "what is it and why would I want it?" in plain words.
- Description: 2–4 short sentences. Cover use (when/how you'd use it), feel/look, and one practical detail (size, care, what's included) when known.
- Bullets: 3–5 scannable facts a shopper checks before buying (size/dimensions, material, what's included, care, shipping/returns). Facts only — no adjectives-only bullets.
- Answer the hesitation: the most likely reason someone wouldn't buy (fit, size, durability, gift-ability) — address it with a fact if you have one.
- Photos sell; copy confirms. Don't describe what the photo already shows unless it carries information (colour name, material).`,

  pricing: `PRICING
- Price from value and cost, not from fear. The data rarely shows the owner's costs: say what you'd need to know (unit cost, target margin) when it matters.
- A product that sells steadily while stock runs low can usually carry a higher price; a product with views but no sales may have a price, photo or description problem — not always a price problem.
- Prefer testing price changes (A/B test) over guessing when there's enough traffic. Recommend a straight change only when the evidence is strong (e.g. clearly underpriced against similar items in the same store).
- Charm endings (.99/.95) suit value positioning; round prices (e.g. $48) suit premium/handmade positioning. Stay consistent across the store.
- Keep price steps meaningful (roughly 10–20%). Tiny changes can't be measured.
- Bundles and free-shipping thresholds lift order value: set the threshold a little above the typical order total.`,

  email: `EMAIL
- Subject: under 50 characters, specific, no clickbait, no ALL CAPS, at most one emoji (prefer none).
- Preheader: a second line that adds information, not a repeat of the subject.
- Body: short. One idea, one call to action. Sound like a person, sign with the store name.
- Flows: Welcome (sent right away: who you are, what to buy first, the welcome code if any) · Abandoned checkout (about an hour later: reminder of the exact items, answer a likely doubt, no pressure) · Post-purchase (next day: thanks, what to expect, how to use/care) · Review request (about a week after delivery: one-click ask, short).
- Never invent discounts in emails — only use codes that exist in the store data.`,

  testing: `A/B TESTING
- Test one change at a time, on something many visitors see: homepage headline, best-seller price, free-shipping threshold, first-order discount.
- Write a hypothesis: "Because <observation>, changing <thing> to <value> will increase <metric>."
- Make variant B meaningfully different (a new angle, not a synonym). Small tweaks need huge traffic to measure.
- Judge headline and shipping tests on conversion rate; judge price and discount tests on revenue per visitor (cheaper can win orders but lose money).
- Let tests reach the minimum sample before deciding. Low-traffic stores should run fewer, bigger tests.
- Don't run two tests on the same thing at once. Use what past tests taught (see lessons) — don't re-test a settled question.`,

  seo: `SEARCH (SEO)
- SEO title: product name + key descriptor + store name when it fits, under 60 characters, front-load the words a shopper would search.
- Meta description: 120–155 characters, a plain sentence that says what it is and why to click. No keyword lists.
- Use the words customers use ("soy candle", not "olfactory experience"). One topic per page.
- Never claim rankings, reviews or prices that aren't in the data.`,

  support: `CUSTOMER SERVICE
- Reply within the first sentence to the actual question. Warm, brief, specific; use the customer's first name if given.
- Use the order data (status, items, dates) — never invent tracking numbers, delivery dates or policies.
- Store policies to assume unless the owner says otherwise: ships in 1–3 business days, 30-day returns on unused items.
- If the customer is upset: acknowledge, take responsibility for the fix, give the next step. No blame, no corporate phrases.
- Refunds, replacements, exceptions and anything legal or about safety: draft the reply but flag it for the owner (needsOwner = true).
- Never share other customers' information. Never ask for card details.`,

  merch: `MERCHANDISING
- The homepage should make the next click obvious: one clear headline, the best seller visible without scrolling, one primary button.
- Lead with the products that sell; hide or fix the ones that don't.
- Free-shipping threshold, returns policy and secure checkout belong near the buy button — they answer the last doubts.
- Grow the email list from day one (first-order offer in the popup), then turn buyers into repeat buyers (post-purchase email, loyalty).`,
};

export function playbook(sections: PlaybookSection[]) {
  return sections.map((s) => PLAYBOOK[s]).join("\n\n");
}

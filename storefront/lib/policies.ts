/**
 * Store policies (shipping, returns, privacy, terms). Each starts as a plain-language template filled from the
 * store's settings, so it stays correct when prices or times change. The owner can replace any of them.
 * Format: blank line between paragraphs; a line starting with "## " is a heading.
 */
import { money } from "./format";
import type { PolicyKind, Store } from "./types";

export const POLICY_KINDS: PolicyKind[] = ["shipping", "returns", "privacy", "terms"];
export const POLICY_TITLE: Record<PolicyKind, string> = { shipping: "Shipping policy", returns: "Returns & refunds", privacy: "Privacy policy", terms: "Terms of service" };

const contact = (s: Store) => (s.business.email ? `email us at ${s.business.email}` : "contact us through this website");

export function policyTemplate(kind: PolicyKind, s: Store): string {
  const b = s.business;
  const who = b.legalName || s.name;
  switch (kind) {
    case "shipping":
      return `## Processing time
Orders are prepared and handed to the carrier within ${b.processingDays} of payment. Orders placed on weekends or holidays start processing the next business day.

## Delivery time
Once shipped, delivery usually takes ${b.deliveryDays}. Times depend on the carrier and your location and aren't guaranteed. Some orders ship from our fulfilment partner's warehouse, and orders with several items may arrive in separate packages.

## Shipping cost
Shipping is ${s.shippingCents ? money(s.shippingCents) : "free"} per order${s.freeShippingCents && s.shippingCents ? `, and free on orders over ${money(s.freeShippingCents)}` : ""}. The exact amount is shown at checkout before you pay.

## Tracking
When your order ships we'll send you a tracking number. You can also check it any time on our order tracking page with your order number and email.

## Lost or late orders
If your tracking hasn't updated in 7 days, or your order hasn't arrived 10 days after the latest estimated date, ${contact(s)} with your order number and we'll sort it out.

## Wrong address
Please check your address at checkout. If you spot a mistake, contact us right away: we can update it until the order ships.`;
    case "returns":
      return `## Returns
You can return unused items in their original condition within ${b.returnDays} days of delivery. To start a return, ${contact(s)} with your order number. Please don't send items back without contacting us first, so we can give you the right return address.

## Refunds
Once we receive and check your return, we'll refund the item price to your original payment method. Refunds usually show up within 5–10 business days, depending on your bank. Original shipping costs aren't refunded unless the item was faulty or wrong.

## Damaged, faulty or wrong items
If something arrives damaged, faulty or isn't what you ordered, ${contact(s)} within 7 days of delivery with your order number and a photo. We'll send a replacement or a full refund, including shipping, and you won't need to pay for a return.

## Cancellations
You can cancel for a full refund until your order ships. After that, the returns policy above applies.

## Items that can't be returned
Gift cards and items marked final sale can't be returned unless they arrive damaged or faulty.`;
    case "privacy":
      return `## Who we are
This website is run by ${who}${b.country ? `, based in ${b.country}` : ""}. To ask anything about your data, ${contact(s)}.

## What we collect
When you order: your name, email, shipping address and what you bought. If you join our email list: your email address. We don't see or store your card number.

## Why we use it
To process, ship and support your order; to send order and shipping updates; and, only if you signed up, to send our newsletter (you can unsubscribe at any time).

## Who we share it with
Only the services needed to run the shop: our payment processor (Stripe) to take payment, our fulfilment partner and shipping carriers to deliver your order, and our email provider to send messages. We don't sell your personal information.

## Cookies and storage
We store your cart and a random visitor ID in your browser so the shop works and so we can improve it. We don't use advertising trackers.

## How long we keep it
Order records are kept as long as we need them for accounting and legal reasons. You can ask us to delete or correct your data at any time.

## Your rights
Depending on where you live (for example under GDPR or CCPA), you may have the right to access, correct, delete or get a copy of your data. ${b.email ? `Email ${b.email} and we'll respond within 30 days.` : "Contact us and we'll respond within 30 days."}`;
    case "terms":
      return `## About these terms
These terms apply when you use this website or buy from ${who}. By placing an order you agree to them.

## Orders and prices
All prices are in US dollars and include any discounts shown at checkout. We may refuse or cancel an order, for example if an item is out of stock or a price was clearly wrong; if we cancel, you get a full refund.

## Payment
Payments are processed securely by Stripe. Your order is confirmed once payment is approved.

## Shipping, returns and refunds
See our Shipping policy and Returns & refunds policy, which are part of these terms.

## Product information
We try to describe and show products accurately. Colours can look slightly different on different screens.

## Liability
To the extent the law allows, our liability for any order is limited to the amount you paid for it. Nothing here limits your rights as a consumer under the law where you live.

## Contact
Questions about these terms? ${contact(s)[0].toUpperCase()}${contact(s).slice(1)}.`;
  }
}

export const policyText = (kind: PolicyKind, s: Store) => (s.policies[kind]?.trim() ? s.policies[kind]! : policyTemplate(kind, s));
export const isPolicyKind = (k: string): k is PolicyKind => (POLICY_KINDS as string[]).includes(k);

/** Plain-text customer messages. Written as the store (white-label). */
import { money } from "./format";
import type { Order, Store } from "./types";

export function trackingMessage(s: Store, o: Order) {
  const t = o.tracking!;
  return {
    subject: `Your ${s.name} order #${o.number} has shipped`,
    text: `Hi ${o.customer.name.split(" ")[0]},\n\nGood news: your order #${o.number} is on its way.\n\nTracking number: ${t.number} (${t.carrier})\nTrack it here: ${t.url}\n\nDelivery usually takes ${s.business.deliveryDays}. Tracking can take a day or two to show the first update.\n\nThanks for shopping with us,\n${s.name}${s.business.email ? `\n${s.business.email}` : ""}`,
  };
}

export function receiptMessage(s: Store, o: Order) {
  const lines = o.items.map((i) => `${i.qty} × ${i.title}${i.variant ? ` (${i.variant})` : ""} — ${money(i.unitCents * i.qty)}`).join("\n");
  return {
    subject: `${s.name} order #${o.number} confirmed`,
    text: `Hi ${o.customer.name.split(" ")[0]},\n\nThanks for your order! Here's your receipt.\n\n${lines}\n${o.discountCents ? `Discount: −${money(o.discountCents)}\n` : ""}Shipping: ${o.shippingCents ? money(o.shippingCents) : "Free"}\nTotal paid: ${money(o.totalCents)}\n\nShipping to: ${o.customer.address}, ${o.customer.city} ${o.customer.zip}, ${o.customer.country}\n\nOrders ship within ${s.business.processingDays}. We'll email your tracking number as soon as it ships.\n\n${s.name}${s.business.email ? `\n${s.business.email}` : ""}`,
  };
}

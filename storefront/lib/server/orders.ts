/** Server-side order steps that touch money or customers: Stripe checkout completion, refunds, tracking. */
import "server-only";
import { randomUUID } from "crypto";
import { commitOrder } from "../commerce";
import { receiptMessage, trackingMessage } from "../emails";
import { trackingInfo } from "../tracking";
import type { Order } from "../types";
import { readDB, updateStoreOnServer } from "./db";
import { sendMail } from "./mail";
import { getCheckout, refundPayment } from "./stripe";

const PENDING_DAYS = 7;

/**
 * Record a paid Stripe checkout as an order. Safe to call many times (redirect + webhook both call it):
 * the second call finds the order and returns it.
 */
export async function finalizeCheckout(slug: string, sessionId: string): Promise<{ ok: true; order: Order } | { ok: false; error: string; status: number }> {
  const paid = await getCheckout(sessionId);
  if (!paid.paid) return { ok: false, error: "This payment hasn't gone through yet.", status: 402 };
  if (paid.slug && paid.slug !== slug) return { ok: false, error: "Unknown checkout.", status: 404 };
  let fresh = false;
  const out = await updateStoreOnServer<Order>(slug, async (s) => {
    const done = s.orders.find((o) => o.payment?.session === sessionId);
    if (done) return { store: s, result: done };
    const p = s.pending.find((x) => x.id === sessionId);
    if (!p) return "We received your payment but couldn't find the order details. Please contact the store with your receipt.";
    fresh = true;
    const totals = paid.amount >= 0 && paid.amount !== p.totals.total ? { ...p.totals, total: paid.amount } : p.totals;
    const { store, order } = commitOrder(s, p.items, p.input, totals, paid.label, randomUUID(), {
      payment: { provider: "stripe", session: sessionId, paymentIntent: paid.paymentIntent, test: paid.test },
      ...(paid.feeCents !== undefined ? { feeCents: paid.feeCents, feeEstimated: false } : {}),
    });
    const cutoff = Date.now() - PENDING_DAYS * 86_400_000;
    return { store: { ...store, pending: store.pending.filter((x) => x.id !== sessionId && Date.parse(x.createdAt) > cutoff) }, result: order };
  });
  if (!out.ok) return out;
  if (fresh) {
    // receipt (only if email is set up); failures never block the order
    const s = (await readDB()).stores.find((x) => x.slug === slug);
    if (s) {
      const m = receiptMessage(s, out.result);
      await sendMail(out.result.customer.email, m.subject, m.text);
    }
  }
  return { ok: true, order: out.result };
}

export async function refundOrderOnServer(slug: string, orderId: string) {
  return updateStoreOnServer<Order>(slug, async (s) => {
    const o = s.orders.find((x) => x.id === orderId);
    if (!o) return "Order not found.";
    if (o.status === "refunded") return "Already refunded.";
    if (o.payment?.provider === "stripe") {
      try {
        await refundPayment(o.payment.paymentIntent, o.payment.session);
      } catch (e) {
        return (e as Error).message;
      }
    }
    const next = { ...o, status: "refunded" as const };
    return {
      store: {
        ...s,
        orders: s.orders.map((x) => (x.id === orderId ? next : x)),
        products: s.products.map((p) => {
          const qty = o.items.filter((i) => i.productId === p.id).reduce((a, i) => a + i.qty, 0);
          return qty ? { ...p, stock: p.stock + qty } : p;
        }),
      },
      result: next,
    };
  });
}

export async function addTracking(slug: string, orderId: string, number: string, carrier?: string) {
  const out = await updateStoreOnServer<{ order: Order; message: { subject: string; text: string } }>(slug, async (s) => {
    const o = s.orders.find((x) => x.id === orderId);
    if (!o) return "Order not found.";
    if (o.status === "refunded") return "This order was refunded.";
    const t = trackingInfo(number, carrier);
    const order: Order = { ...o, status: "fulfilled", tracking: { ...t, addedAt: new Date().toISOString() } };
    return { store: { ...s, orders: s.orders.map((x) => (x.id === orderId ? order : x)) }, result: { order, message: trackingMessage(s, order) } };
  });
  if (!out.ok) return out;
  const emailed = await sendMail(out.result.order.customer.email, out.result.message.subject, out.result.message.text);
  if (emailed) await updateStoreOnServer(slug, async (s) => ({ store: { ...s, orders: s.orders.map((x) => (x.id === orderId && x.tracking ? { ...x, tracking: { ...x.tracking, emailed: true } } : x)) }, result: true }));
  return { ok: true as const, order: { ...out.result.order, tracking: { ...out.result.order.tracking!, emailed } }, message: out.result.message, emailed };
}

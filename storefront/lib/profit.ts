/** What you actually made: sale total minus supplier costs and the payment fee. Owner-only. */
import type { Order, Store } from "./types";

export type Profit = { revenue: number; cost: number | null; fee: number; profit: number | null; feeEstimated: boolean };

export function orderProfit(o: Order, s: Store): Profit {
  const fee = o.feeCents ?? Math.round((o.totalCents * s.costs.feePercent) / 100) + s.costs.feeFixedCents;
  // cost recorded when the order was placed; for older orders use today's product costs if every item has one
  let cost: number | null = o.costCents ?? null;
  if (cost === null) {
    const units = o.items.map((i) => i.unitCostCents ?? s.products.find((p) => p.id === i.productId)?.costCents);
    cost = units.every((u) => u !== undefined) ? units.reduce((a: number, u, k) => a + (u as number) * o.items[k].qty, 0) + s.costs.supplierShippingCents : null;
  }
  if (o.status === "refunded") return { revenue: 0, cost: 0, fee, profit: -fee, feeEstimated: o.feeEstimated ?? true }; // Stripe keeps its fee on refunds
  return { revenue: o.totalCents, cost, fee, profit: cost === null ? null : o.totalCents - cost - fee, feeEstimated: o.feeEstimated ?? true };
}

/** Profit for one product sale at its current price (ignores discounts and shipping charged). */
export function unitProfit(priceCents: number, costCents: number | undefined, s: Store) {
  if (costCents === undefined) return null;
  const fee = Math.round((priceCents * s.costs.feePercent) / 100) + s.costs.feeFixedCents;
  const profit = priceCents - costCents - fee - s.costs.supplierShippingCents;
  return { profit, margin: priceCents ? Math.round((profit / priceCents) * 100) : 0 };
}

export function totalProfit(orders: Order[], s: Store) {
  let profit = 0;
  let missing = 0;
  for (const o of orders) {
    const p = orderProfit(o, s);
    if (p.profit === null) missing++;
    else profit += p.profit;
  }
  return { profit, missing };
}

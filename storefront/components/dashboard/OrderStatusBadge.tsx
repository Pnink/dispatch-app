import type { OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  if (status === "paid") return <Badge tone="warning">Unfulfilled</Badge>;
  if (status === "fulfilled") return <Badge tone="success">Fulfilled</Badge>;
  return <Badge>Refunded</Badge>;
}

import type { OrderStatus, PaymentStatus } from "@/types";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "pickedup",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export const ORDER_STATUS_COLORS: Record<
  OrderStatus,
  "default" | "success" | "warning" | "destructive" | "secondary" | "info"
> = {
  pending: "warning",
  confirmed: "info",
  preparing: "warning",
  ready_for_pickup: "info",
  pickedup: "info",
  out_for_delivery: "info",
  delivered: "success",
  cancelled: "destructive",
};

export const PAYMENT_STATUS_COLORS: Record<
  PaymentStatus,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  pending: "warning",
  paid: "success",
  failed: "destructive",
  refunded: "secondary",
};

export const ORDER_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  ...ORDER_STATUS_FLOW.map((status) => ({
    value: status,
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  })),
];

/** The next status an order can move to in the fulfilment flow. */
export function getNextStatus(current: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_FLOW.indexOf(current);
  if (index === -1 || index === ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[index + 1];
}

/** Formats a status for display, e.g. "ready_for_pickup" -> "Ready For Pickup". */
export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

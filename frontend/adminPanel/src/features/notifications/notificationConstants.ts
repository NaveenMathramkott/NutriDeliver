import type { Notification } from "@/types";

export const NOTIFICATION_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "order", label: "Order" },
  { value: "payment", label: "Payment" },
  { value: "promotion", label: "Promotion" },
  { value: "system", label: "System" },
  { value: "delivery", label: "Delivery" },
];

export const NOTIFICATION_READ_OPTIONS = [
  { value: "", label: "All" },
  { value: "true", label: "Read" },
  { value: "false", label: "Unread" },
];

export const NOTIFICATION_TYPE_COLORS: Record<
  Notification["type"],
  "default" | "success" | "warning" | "destructive" | "secondary" | "info"
> = {
  order: "info",
  payment: "success",
  promotion: "warning",
  system: "secondary",
  delivery: "default",
};

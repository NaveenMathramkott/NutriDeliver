export interface RefundFormValues {
  amount: number;
  reason: string;
}

export const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "All Methods" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "digital_wallet", label: "Digital Wallet" },
];

export const PAYMENT_STATUS_COLORS: Record<
  string,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  pending: "warning",
  paid: "success",
  failed: "destructive",
  refunded: "secondary",
};

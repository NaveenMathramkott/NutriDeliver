export type RiderAvailability = "available" | "busy" | "offline";

export const RIDER_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "offline", label: "Offline" },
];

export const RIDER_VERIFIED_OPTIONS = [
  { value: "", label: "All Verification" },
  { value: "true", label: "Verified" },
  { value: "false", label: "Unverified" },
];

export const AVAILABILITY_SELECT_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "offline", label: "Offline" },
];

export const AVAILABILITY_COLORS: Record<
  RiderAvailability,
  "success" | "warning" | "secondary"
> = {
  available: "success",
  busy: "warning",
  offline: "secondary",
};

export function availabilityBadge(
  status?: string,
): "success" | "warning" | "secondary" {
  return AVAILABILITY_COLORS[status as RiderAvailability] || "secondary";
}

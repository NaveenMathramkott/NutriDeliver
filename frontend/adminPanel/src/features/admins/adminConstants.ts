import type { UserRole } from "@/types";

export const ADMIN_PERMISSIONS = [
  "users.read",
  "users.write",
  "users.delete",
  "restaurants.read",
  "restaurants.write",
  "restaurants.delete",
  "riders.read",
  "riders.write",
  "riders.delete",
  "orders.read",
  "orders.write",
  "payments.read",
  "payments.write",
  "offers.read",
  "offers.write",
  "offers.delete",
  "analytics.read",
  "settings.read",
  "settings.write",
  "admins.read",
  "admins.write",
  "admins.delete",
] as const;

/** Permissions grouped by resource so the picker stays scannable. */
export const PERMISSION_GROUPS: { label: string; permissions: string[] }[] = [
  {
    label: "Users",
    permissions: ["users.read", "users.write", "users.delete"],
  },
  {
    label: "Restaurants",
    permissions: [
      "restaurants.read",
      "restaurants.write",
      "restaurants.delete",
    ],
  },
  {
    label: "Riders",
    permissions: ["riders.read", "riders.write", "riders.delete"],
  },
  {
    label: "Orders",
    permissions: ["orders.read", "orders.write"],
  },
  {
    label: "Payments",
    permissions: ["payments.read", "payments.write"],
  },
  {
    label: "Offers",
    permissions: ["offers.read", "offers.write", "offers.delete"],
  },
  {
    label: "Platform",
    permissions: [
      "analytics.read",
      "settings.read",
      "settings.write",
      "admins.read",
      "admins.write",
      "admins.delete",
    ],
  },
];

export const ADMIN_ROLE_OPTIONS = [{ value: "admin", label: "Admin" }];

export const ROLE_COLORS: Record<
  UserRole,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  user: "default",
  restaurant: "success",
  rider: "warning",
  admin: "destructive",
};

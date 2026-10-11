import type { UserRole } from "@/types";

export const USER_ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "user", label: "User" },
  { value: "restaurant", label: "Restaurant" },
  { value: "rider", label: "Rider" },
  { value: "admin", label: "Admin" },
];

export const USER_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

export const ROLE_COLORS: Record<
  UserRole,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  user: "default",
  restaurant: "success",
  rider: "warning",
  admin: "destructive",
};

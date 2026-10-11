import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// later tailwind utilities win over earlier ones
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

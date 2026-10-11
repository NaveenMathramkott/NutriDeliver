export type DiscountType = "percentage" | "fixed";

export interface OfferFormValues {
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableCategories: string[];
  applicableRestaurants: string[];
}

export const emptyOfferForm: OfferFormValues = {
  code: "",
  title: "",
  description: "",
  discountType: "percentage",
  discountValue: 0,
  minOrderAmount: 0,
  maxDiscount: 0,
  usageLimit: 0,
  usedCount: 0,
  validFrom: "",
  validUntil: "",
  isActive: true,
  applicableCategories: [],
  applicableRestaurants: [],
};

export const DISCOUNT_TYPE_OPTIONS = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed Amount ($)" },
];

export const DISCOUNT_TYPE_COLORS: Record<DiscountType, "default" | "success"> =
  {
    percentage: "default",
    fixed: "success",
  };

/** Formats an ISO date for a native date input (yyyy-MM-dd). */
export function toDateInputValue(iso?: string): string {
  return iso ? iso.split("T")[0] : "";
}

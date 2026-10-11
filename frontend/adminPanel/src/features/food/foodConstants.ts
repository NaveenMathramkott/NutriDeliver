import type { Category } from "@/types";

export const AVAILABILITY_OPTIONS = [
  { value: "", label: "All" },
  { value: "true", label: "Available" },
  { value: "false", label: "Unavailable" },
];

export const DIETARY_TAGS = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "dairy-free",
  "nut-free",
  "spicy",
  "halal",
  "kosher",
] as const;

export function categoryOptions(categories: Category[]) {
  return [
    { value: "", label: "All Categories" },
    ...categories.map((category) => ({
      value: category._id,
      label: category.name,
    })),
  ];
}

import { Bell, Shield, Globe, Truck, CreditCard, Utensils } from "lucide-react";
import type { SystemSettings } from "@/types";

export type SettingsKey = keyof SystemSettings["settings"];

export interface SettingFieldDef {
  key: SettingsKey;
  label: string;
  type: "text" | "email" | "number" | "select";
  description?: string;
  /** Extra help text for numeric fields, e.g. the unit. */
  suffix?: string;
  options?: { value: string; label: string }[];
}

/**
 * Declarative schema for every settings field. The page maps over these to
 * render a consistently aligned grid, so adding a setting is a one-line change.
 */
export const SETTINGS_SECTIONS: {
  id: string;
  title: string;
  description: string;
  icon: typeof Globe;
  fields: SettingFieldDef[];
}[] = [
  {
    id: "general",
    title: "General",
    description: "Basic platform configuration",
    icon: Globe,
    fields: [
      { key: "platformName", label: "Platform Name", type: "text" },
      {
        key: "supportEmail",
        label: "Support Email",
        type: "email",
        description: "Shown to customers in support flows",
      },
      {
        key: "defaultDeliveryFee",
        label: "Default Delivery Fee",
        type: "number",
        suffix: "$",
      },
      { key: "taxRate", label: "Tax Rate", type: "number", suffix: "%" },
      {
        key: "maxDeliveryRadius",
        label: "Max Delivery Radius",
        type: "number",
        suffix: "km",
      },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Choose which events trigger an admin notification",
    icon: Bell,
    fields: [],
  },
  {
    id: "security",
    title: "Security",
    description: "Security and authentication settings",
    icon: Shield,
    fields: [
      {
        key: "sessionTimeout",
        label: "Session Timeout",
        type: "number",
        suffix: "minutes",
      },
      {
        key: "maxLoginAttempts",
        label: "Max Login Attempts",
        type: "number",
      },
      {
        key: "passwordMinLength",
        label: "Min Password Length",
        type: "number",
        suffix: "characters",
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    description: "Delivery and logistics configuration",
    icon: Truck,
    fields: [
      {
        key: "freeDeliveryThreshold",
        label: "Free Delivery Threshold",
        type: "number",
        suffix: "$",
      },
      {
        key: "riderTimeout",
        label: "Rider Timeout",
        type: "number",
        suffix: "seconds",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    description: "Payment gateway configuration",
    icon: CreditCard,
    fields: [
      {
        key: "stripePublishableKey",
        label: "Stripe Publishable Key",
        type: "text",
        description: "Safe to expose to the browser",
      },
      {
        key: "stripeSecretKey",
        label: "Stripe Secret Key",
        type: "text",
        description: "Stored server-side only",
      },
    ],
  },
  {
    id: "restaurants",
    title: "Restaurants",
    description: "Restaurant onboarding and management",
    icon: Utensils,
    fields: [
      {
        key: "minOrderAmount",
        label: "Default Min Order Amount",
        type: "number",
        suffix: "$",
      },
      {
        key: "commissionRate",
        label: "Platform Commission Rate",
        type: "number",
        suffix: "%",
      },
      {
        key: "maxMenuItems",
        label: "Max Menu Items per Restaurant",
        type: "number",
      },
    ],
  },
];

export const DEFAULT_SETTINGS: SystemSettings["settings"] = {
  platformName: "NutriDeliver",
  supportEmail: "support@nutrideliver.com",
  defaultDeliveryFee: 3.99,
  taxRate: 8.5,
  maxDeliveryRadius: 15,
  freeDeliveryThreshold: 50,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  stripePublishableKey: "",
  stripeSecretKey: "",
  minOrderAmount: 15,
  commissionRate: 15,
  maxMenuItems: 100,
  riderTimeout: 60,
};

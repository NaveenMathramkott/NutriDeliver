"use client";

import React, { useState } from "react";
import {
  Save,
  Bell,
  Shield,
  Globe,
  Palette,
  Database,
  Mail,
  Truck,
  CreditCard,
  Utensils,
  Key,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { api } from "@/services/api";

const generalSettings = [
  {
    key: "platformName",
    label: "Platform Name",
    type: "text",
    placeholder: "NutriDeliver",
  },
  {
    key: "supportEmail",
    label: "Support Email",
    type: "email",
    placeholder: "support@nutrideliver.com",
  },
  {
    key: "supportPhone",
    label: "Support Phone",
    type: "tel",
    placeholder: "+1 234 567 8900",
  },
  {
    key: "defaultCurrency",
    label: "Default Currency",
    type: "select",
    options: ["USD", "EUR", "GBP", "INR"],
  },
  {
    key: "timezone",
    label: "Timezone",
    type: "select",
    options: [
      "UTC",
      "America/New_York",
      "America/Los_Angeles",
      "Europe/London",
      "Asia/Kolkata",
    ],
  },
  { key: "maintenanceMode", label: "Maintenance Mode", type: "boolean" },
];

const notificationSettings = [
  { key: "emailNotifications", label: "Email Notifications", type: "boolean" },
  { key: "pushNotifications", label: "Push Notifications", type: "boolean" },
  { key: "smsNotifications", label: "SMS Notifications", type: "boolean" },
  { key: "orderNotifications", label: "Order Updates", type: "boolean" },
  { key: "paymentNotifications", label: "Payment Alerts", type: "boolean" },
  { key: "marketingEmails", label: "Marketing Emails", type: "boolean" },
];

const securitySettings = [
  { key: "twoFactorAuth", label: "Two-Factor Authentication", type: "boolean" },
  {
    key: "sessionTimeout",
    label: "Session Timeout (minutes)",
    type: "number",
    placeholder: "60",
  },
  {
    key: "maxLoginAttempts",
    label: "Max Login Attempts",
    type: "number",
    placeholder: "5",
  },
  {
    key: "passwordMinLength",
    label: "Minimum Password Length",
    type: "number",
    placeholder: "8",
  },
  {
    key: "requireEmailVerification",
    label: "Require Email Verification",
    type: "boolean",
  },
];

const deliverySettings = [
  {
    key: "defaultDeliveryFee",
    label: "Default Delivery Fee",
    type: "number",
    placeholder: "3.99",
  },
  {
    key: "freeDeliveryThreshold",
    label: "Free Delivery Threshold",
    type: "number",
    placeholder: "50.00",
  },
  {
    key: "maxDeliveryRadius",
    label: "Max Delivery Radius (km)",
    type: "number",
    placeholder: "15",
  },
  { key: "autoAssignRiders", label: "Auto-assign Riders", type: "boolean" },
  {
    key: "riderTimeout",
    label: "Rider Acceptance Timeout (seconds)",
    type: "number",
    placeholder: "60",
  },
];

const paymentSettings = [
  { key: "stripeEnabled", label: "Enable Stripe", type: "boolean" },
  {
    key: "stripePublishableKey",
    label: "Stripe Publishable Key",
    type: "text",
    placeholder: "pk_test_...",
  },
  {
    key: "stripeSecretKey",
    label: "Stripe Secret Key",
    type: "password",
    placeholder: "sk_test_...",
  },
  { key: "walletEnabled", label: "Enable Wallet", type: "boolean" },
  { key: "cashOnDelivery", label: "Cash on Delivery", type: "boolean" },
];

const restaurantSettings = [
  {
    key: "autoApproveRestaurants",
    label: "Auto-approve Restaurants",
    type: "boolean",
  },
  {
    key: "minOrderAmount",
    label: "Default Min Order Amount",
    type: "number",
    placeholder: "15.00",
  },
  {
    key: "commissionRate",
    label: "Platform Commission Rate (%)",
    type: "number",
    placeholder: "15",
  },
  {
    key: "maxMenuItems",
    label: "Max Menu Items per Restaurant",
    type: "number",
    placeholder: "100",
  },
];

export function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    platformName: "NutriDeliver",
    supportEmail: "support@nutrideliver.com",
    supportPhone: "+1 234 567 8900",
    defaultCurrency: "USD",
    timezone: "UTC",
    maintenanceMode: false,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    paymentNotifications: true,
    marketingEmails: false,
    twoFactorAuth: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireEmailVerification: true,
    defaultDeliveryFee: 3.99,
    freeDeliveryThreshold: 50.0,
    maxDeliveryRadius: 15,
    autoAssignRiders: true,
    riderTimeout: 60,
    stripeEnabled: true,
    stripePublishableKey: "",
    stripeSecretKey: "",
    walletEnabled: true,
    cashOnDelivery: true,
    autoApproveRestaurants: false,
    minOrderAmount: 15.0,
    commissionRate: 15,
    maxMenuItems: 100,
  });

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.updateSettings(settings);
      if (response.success) {
        toast({
          title: "Success",
          description: "Settings saved successfully",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderSetting = (setting: {
    key: string;
    label: string;
    type: string;
    placeholder?: string;
    options?: string[];
  }) => {
    const value = settings[setting.key as keyof typeof settings];

    const handleBooleanChange = (checked: boolean) => {
      handleChange(setting.key, checked);
    };

    const handleStringChange = (val: string) => {
      handleChange(setting.key, val);
    };

    const handleNumberChange = (val: string) => {
      handleChange(setting.key, parseFloat(val) || 0);
    };

    switch (setting.type) {
      case "boolean":
        return (
          <div className="flex items-center justify-between">
            <Label>{setting.label}</Label>
            <Switch
              checked={value as boolean}
              onCheckedChange={handleBooleanChange}
            />
          </div>
        );
      case "select":
        return (
          <div className="space-y-2">
            <Label>{setting.label}</Label>
            <Select value={value as string} onValueChange={handleStringChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {setting.options?.map((opt: string) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case "number":
        return (
          <div className="space-y-2">
            <Label>{setting.label}</Label>
            <Input
              type="number"
              step="0.01"
              value={value as number}
              onChange={(e) => handleNumberChange(e.target.value)}
              placeholder={setting.placeholder}
            />
          </div>
        );
      case "password":
        return (
          <div className="space-y-2">
            <Label>{setting.label}</Label>
            <Input
              type="password"
              value={value as string}
              onChange={(e) => handleStringChange(e.target.value)}
              placeholder={setting.placeholder}
            />
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <Label>{setting.label}</Label>
            <Input
              value={value as string}
              onChange={(e) => handleStringChange(e.target.value)}
              placeholder={setting.placeholder}
            />
          </div>
        );
    }
  };

  const renderSection = (
    title: string,
    Icon: React.ComponentType<{ className?: string }>,
    description: string,
    settingsList: any[],
  ) => (
    <TabsContent value={title.toLowerCase().replace(/\s+/g, "")}>
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Separator />
        <div className="grid gap-6 md:grid-cols-2">
          {settingsList.map((setting) => (
            <div key={setting.key}>{renderSetting(setting)}</div>
          ))}
        </div>
      </div>
    </TabsContent>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure platform settings</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
        </TabsList>

        {renderSection(
          "General",
          Globe,
          "Basic platform configuration",
          generalSettings,
        )}
        {renderSection(
          "Notifications",
          Bell,
          "Notification preferences and channels",
          notificationSettings,
        )}
        {renderSection(
          "Security",
          Shield,
          "Security and authentication settings",
          securitySettings,
        )}
        {renderSection(
          "Delivery",
          Truck,
          "Delivery and logistics configuration",
          deliverySettings,
        )}
        {renderSection(
          "Payments",
          CreditCard,
          "Payment gateway and transaction settings",
          paymentSettings,
        )}
        {renderSection(
          "Restaurants",
          Utensils,
          "Restaurant onboarding and management",
          restaurantSettings,
        )}
      </Tabs>
    </div>
  );
}

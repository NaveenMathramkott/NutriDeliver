"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  Bell,
  Shield,
  Globe,
  Mail,
  Truck,
  CreditCard,
  Utensils,
  Key,
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
import type { SystemSettings } from "@/types";

export function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings["settings"]>({
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
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await api.getSettings();
      if (response.success && response.data) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: keyof typeof settings, value: any) => {
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
          description: response.message || "Failed to save settings",
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

  const renderSetting = (
    label: string,
    key: keyof typeof settings,
    type: "text" | "email" | "number" | "select" | "boolean" = "text",
    options?: { value: string; label: string }[],
  ) => {
    const value = settings[key];

    if (type === "boolean") {
      return (
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => handleChange(key, checked)}
          />
        </div>
      );
    }

    if (type === "select") {
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <Select
            value={value as string}
            onValueChange={(val) => handleChange(key, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (type === "number") {
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <Input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => handleChange(key, parseFloat(e.target.value) || 0)}
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          type={type}
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
        />
      </div>
    );
  };

  const renderSection = (
    title: string,
    Icon: React.ComponentType<{ className?: string }>,
    description: string,
    children: React.ReactNode,
  ) => (
    <TabsContent value={title.toLowerCase()}>
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
        {children}
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
          <div className="grid gap-6 md:grid-cols-2">
            {renderSetting("Platform Name", "platformName", "text")}
            {renderSetting("Support Email", "supportEmail", "email")}
            {renderSetting(
              "Default Delivery Fee",
              "defaultDeliveryFee",
              "number",
            )}
            {renderSetting("Tax Rate (%)", "taxRate", "number")}
            {renderSetting(
              "Max Delivery Radius (km)",
              "maxDeliveryRadius",
              "number",
            )}
          </div>,
        )}

        {renderSection(
          "Notifications",
          Bell,
          "Notification preferences",
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Email Notifications</Label>
              <Switch checked={false} onCheckedChange={() => {}} />
            </div>
            <div className="space-y-2">
              <Label>Push Notifications</Label>
              <Switch checked={false} onCheckedChange={() => {}} />
            </div>
            <div className="space-y-2">
              <Label>SMS Notifications</Label>
              <Switch checked={false} onCheckedChange={() => {}} />
            </div>
            <div className="space-y-2">
              <Label>Order Updates</Label>
              <Switch checked={false} onCheckedChange={() => {}} />
            </div>
            <div className="space-y-2">
              <Label>Payment Alerts</Label>
              <Switch checked={false} onCheckedChange={() => {}} />
            </div>
            <div className="space-y-2">
              <Label>Marketing Emails</Label>
              <Switch checked={false} onCheckedChange={() => {}} />
            </div>
          </div>,
        )}

        {renderSection(
          "Security",
          Shield,
          "Security and authentication settings",
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Two-Factor Authentication</Label>
              <Switch checked={false} onCheckedChange={() => {}} />
            </div>
            {renderSetting(
              "Session Timeout (minutes)",
              "sessionTimeout",
              "number",
            )}
            {renderSetting("Max Login Attempts", "maxLoginAttempts", "number")}
            {renderSetting(
              "Min Password Length",
              "passwordMinLength",
              "number",
            )}
            <div className="space-y-2">
              <Label>Require Email Verification</Label>
              <Switch checked={true} onCheckedChange={() => {}} />
            </div>
          </div>,
        )}

        {renderSection(
          "Delivery",
          Truck,
          "Delivery and logistics configuration",
          <div className="grid gap-6 md:grid-cols-2">
            {renderSetting(
              "Default Delivery Fee",
              "defaultDeliveryFee",
              "number",
            )}
            {renderSetting(
              "Free Delivery Threshold",
              "freeDeliveryThreshold",
              "number",
            )}
            {renderSetting(
              "Max Delivery Radius (km)",
              "maxDeliveryRadius",
              "number",
            )}
            <div className="space-y-2">
              <Label>Auto-assign Riders</Label>
              <Switch checked={true} onCheckedChange={() => {}} />
            </div>
            {renderSetting("Rider Timeout (seconds)", "riderTimeout", "number")}
          </div>,
        )}

        {renderSection(
          "Payments",
          CreditCard,
          "Payment gateway configuration",
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Enable Stripe</Label>
              <Switch checked={true} onCheckedChange={() => {}} />
            </div>
            {renderSetting(
              "Stripe Publishable Key",
              "stripePublishableKey",
              "text",
            )}
            {renderSetting("Stripe Secret Key", "stripeSecretKey", "text")}
            <div className="space-y-2">
              <Label>Enable Wallet</Label>
              <Switch checked={true} onCheckedChange={() => {}} />
            </div>
            <div className="space-y-2">
              <Label>Cash on Delivery</Label>
              <Switch checked={true} onCheckedChange={() => {}} />
            </div>
          </div>,
        )}

        {renderSection(
          "Restaurants",
          Utensils,
          "Restaurant onboarding and management",
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Auto-approve Restaurants</Label>
              <Switch checked={false} onCheckedChange={() => {}} />
            </div>
            {renderSetting(
              "Default Min Order Amount",
              "minOrderAmount",
              "number",
            )}
            {renderSetting(
              "Platform Commission Rate (%)",
              "commissionRate",
              "number",
            )}
            {renderSetting(
              "Max Menu Items per Restaurant",
              "maxMenuItems",
              "number",
            )}
          </div>,
        )}
      </Tabs>
    </div>
  );
}

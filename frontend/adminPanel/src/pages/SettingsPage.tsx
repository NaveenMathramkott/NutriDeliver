"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common";
import { toast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import type { SystemSettings } from "@/types";
import {
  SETTINGS_SECTIONS,
  DEFAULT_SETTINGS,
  SettingsField,
  ToggleSetting,
  type SettingsKey,
} from "@/features/settings";

type Settings = SystemSettings["settings"];
type Toggles = Record<string, boolean>;

const DEFAULT_TOGGLES: Toggles = {
  emailNotifications: true,
  pushNotifications: false,
  smsNotifications: false,
  orderUpdates: true,
  paymentAlerts: true,
  marketingEmails: false,
  twoFactorAuth: false,
  requireEmailVerification: true,
  autoAssignRiders: true,
  enableStripe: true,
  enableWallet: true,
  cashOnDelivery: true,
  autoApproveRestaurants: false,
};

/** Which tab each toggle belongs to. */
const TOGGLES_BY_SECTION: Record<string, [string, string, string?][]> = {
  notifications: [
    ["emailNotifications", "Email Notifications", "Order and account emails"],
    ["pushNotifications", "Push Notifications", "Browser push notifications"],
    ["smsNotifications", "SMS Notifications", "Critical alerts via SMS"],
    ["orderUpdates", "Order Updates", "New, updated and cancelled orders"],
    ["paymentAlerts", "Payment Alerts", "Refunds and failed payments"],
    ["marketingEmails", "Marketing Emails", "Promotional campaigns"],
  ],
  security: [
    ["twoFactorAuth", "Two-Factor Authentication", "Require 2FA for admins"],
    [
      "requireEmailVerification",
      "Require Email Verification",
      "Users must verify their email",
    ],
  ],
  delivery: [
    [
      "autoAssignRiders",
      "Auto-assign Riders",
      "Assign the nearest available rider",
    ],
  ],
  payments: [
    ["enableStripe", "Enable Stripe", "Card payments via Stripe"],
    ["enableWallet", "Enable Wallet", "In-app wallet balance"],
    ["cashOnDelivery", "Cash on Delivery", "Allow cash at the door"],
  ],
  restaurants: [
    [
      "autoApproveRestaurants",
      "Auto-approve Restaurants",
      "Skip manual review for new signups",
    ],
  ],
};

export function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [toggles, setToggles] = useState<Toggles>(DEFAULT_TOGGLES);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.getSettings();
      if (response.success && response.data) {
        setSettings({ ...DEFAULT_SETTINGS, ...response.data.settings });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: SettingsKey, value: string | number) => {
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
    } catch {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure platform settings"
        action={
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      <Tabs defaultValue={SETTINGS_SECTIONS[0].id} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {SETTINGS_SECTIONS.map((section) => (
            <TabsTrigger key={section.id} value={section.id}>
              {section.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const sectionToggles = TOGGLES_BY_SECTION[section.id] ?? [];
          return (
            <TabsContent key={section.id} value={section.id}>
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>

                <Separator />

                {section.fields.length > 0 && (
                  <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                    {section.fields.map((field) => (
                      <SettingsField
                        key={field.key}
                        field={field}
                        value={settings[field.key] as string | number}
                        onChange={(value) => handleChange(field.key, value)}
                      />
                    ))}
                  </div>
                )}

                {sectionToggles.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {sectionToggles.map(([key, label, description]) => (
                      <ToggleSetting
                        key={key}
                        id={`toggle-${key}`}
                        label={label}
                        description={description}
                        checked={toggles[key]}
                        onCheckedChange={(checked) =>
                          setToggles((prev) => ({ ...prev, [key]: checked }))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  DollarSign,
  Store,
  Truck,
  Package,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, StatCard } from "@/components/common";
import { SelectField } from "@/components/form";
import { api } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import type { PlatformAnalytics, SalesAnalytics, UserAnalytics } from "@/types";

const DATE_RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "1y", label: "Last Year" },
];

export function AnalyticsPage() {
  const [platformAnalytics, setPlatformAnalytics] =
    useState<PlatformAnalytics | null>(null);
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics | null>(
    null,
  );
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const groupBy =
        dateRange === "7d"
          ? "day"
          : dateRange === "30d"
            ? "day"
            : dateRange === "90d"
              ? "week"
              : "month";
      const [platformRes, salesRes, usersRes] = await Promise.all([
        api.getPlatformAnalytics(),
        api.getSalesAnalytics({ groupBy }),
        api.getUserAnalytics(),
      ]);
      if (platformRes.success) setPlatformAnalytics(platformRes.data as any);
      if (salesRes.success) setSalesAnalytics(salesRes.data as any);
      if (usersRes.success) setUserAnalytics(usersRes.data as any);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    fetchAnalytics();
  };

  const maxDailySales = Math.max(
    ...(salesAnalytics?.salesOverTime?.map((d) => d.dailySales) ?? [0]),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Platform performance and insights"
        action={
          <>
            <SelectField
              id="analytics-date-range"
              label="Date Range"
              hideLabel
              className="w-[180px]"
              options={DATE_RANGE_OPTIONS}
              value={dateRange}
              onValueChange={handleDateRangeChange}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={fetchAnalytics}
              aria-label="Refresh analytics"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {platformAnalytics && !isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="Total Users"
            value={platformAnalytics.analytics.users.total.toLocaleString()}
            icon={<Users className="h-5 w-5" />}
            tone="bg-primary/10 text-primary"
            hint={`+${platformAnalytics.analytics.users.new} this month`}
            hintTone="text-fresh-700 dark:text-fresh-400"
          />
          <StatCard
            label="Total Restaurants"
            value={platformAnalytics.analytics.restaurants.total.toLocaleString()}
            icon={<Store className="h-5 w-5" />}
            tone="bg-fresh-100 text-fresh-700 dark:bg-fresh-500/15 dark:text-fresh-400"
            hint={`${platformAnalytics.analytics.restaurants.active} active`}
            hintTone="text-fresh-700 dark:text-fresh-400"
          />
          <StatCard
            label="Total Riders"
            value="N/A"
            icon={<Truck className="h-5 w-5" />}
            tone="bg-muted text-muted-foreground"
            hint="Data not available"
          />
          <StatCard
            label="Total Orders"
            value={platformAnalytics.analytics.orders.total.toLocaleString()}
            icon={<Package className="h-5 w-5" />}
            tone="bg-primary/10 text-primary"
            hint={`${platformAnalytics.analytics.orders.recent} recent`}
            hintTone="text-fresh-700 dark:text-fresh-400"
          />
          <StatCard
            label="Total Revenue"
            value={`$${platformAnalytics.analytics.revenue.totalRevenue.toLocaleString()}`}
            icon={<DollarSign className="h-5 w-5" />}
            tone="bg-fresh-100 text-fresh-700 dark:bg-fresh-500/15 dark:text-fresh-400"
            hint={`$${platformAnalytics.analytics.revenue.recentRevenue.toLocaleString()} recent`}
            hintTone="text-fresh-700 dark:text-fresh-400"
          />
          <StatCard
            label="Avg Order Value"
            value={`$${
              platformAnalytics.analytics.orders.total > 0
                ? (
                    platformAnalytics.analytics.revenue.totalRevenue /
                    platformAnalytics.analytics.orders.total
                  ).toFixed(2)
                : "0.00"
            }`}
            icon={<BarChart3 className="h-5 w-5" />}
            tone="bg-primary/10 text-primary"
          />
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-around p-4">
                  {platformAnalytics?.analytics.orders.byStatus?.map(
                    (status) => (
                      <div
                        key={status._id}
                        className="flex flex-col items-center gap-2 w-full"
                      >
                        <div
                          className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                          style={{
                            height: `${platformAnalytics.analytics.orders.total > 0 ? (status.count / platformAnalytics.analytics.orders.total) * 100 : 0}%`,
                          }}
                          title={`${status._id}: ${status.count}`}
                        />
                        <span className="text-xs text-muted-foreground capitalize">
                          {status._id.replace("_", " ")}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Users by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-around p-4">
                  {platformAnalytics?.analytics.users.byRole?.map((role) => (
                    <div
                      key={role._id}
                      className="flex flex-col items-center gap-2 w-full"
                    >
                      <div
                        className="w-full bg-green-500 rounded-t transition-all hover:bg-green-500/80"
                        style={{
                          height: `${platformAnalytics.analytics.users.total > 0 ? (role.count / platformAnalytics.analytics.users.total) * 100 : 0}%`,
                        }}
                        title={`${role._id}: ${role.count}`}
                      />
                      <span className="text-xs text-muted-foreground capitalize">
                        {role._id}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-80 items-end justify-around gap-1.5 overflow-x-auto p-4">
                {salesAnalytics?.salesOverTime?.map((day) => (
                  <div
                    key={day._id}
                    className="flex w-full min-w-[28px] flex-col items-center gap-2"
                  >
                    <div
                      className="w-full rounded-t bg-primary transition-all hover:bg-primary/80"
                      style={{
                        height: `${
                          maxDailySales > 0
                            ? Math.max(
                                (day.dailySales / maxDailySales) * 100,
                                2,
                              )
                            : 2
                        }%`,
                      }}
                      title={`$${day.dailySales.toLocaleString()} · ${day.orderCount} orders`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {day._id}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top Restaurants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesAnalytics?.topRestaurants?.map((r, index) => (
                  <div
                    key={r._id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {r.restaurant?.name || "Deleted restaurant"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {r.orderCount.toLocaleString()} orders
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${r.totalSales.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Popular Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesAnalytics?.popularItems?.map((item, index) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.foodItem?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.totalQuantity} sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${item.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-end justify-around p-4">
                {userAnalytics?.userGrowth?.map((day) => (
                  <div
                    key={day._id}
                    className="flex flex-col items-center gap-2 w-full"
                  >
                    <div
                      className="w-full bg-green-500 rounded-t transition-all hover:bg-green-500/80"
                      style={{
                        height: `${userAnalytics.userGrowth.length > 0 ? (day.newUsers / Math.max(...userAnalytics.userGrowth.map((d) => d.newUsers))) * 100 : 0}%`,
                      }}
                      title={day.newUsers.toString()}
                    />
                    <span className="text-xs text-muted-foreground">
                      {day._id}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-4xl font-bold">
                  {userAnalytics?.activeUsers?.toLocaleString() || 0}
                </p>
                <p className="text-muted-foreground">ordered in last 30 days</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Avg Order Value by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userAnalytics?.avgOrderValue?.map((role) => (
                  <div
                    key={role._id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        {role._id}
                      </div>
                      <span className="capitalize">{role._id}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${role.avgOrderValue.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {role.totalOrders} orders
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restaurants">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6 text-center">
                    <p className="text-3xl font-bold text-green-700">
                      {platformAnalytics?.analytics.restaurants.total || 0}
                    </p>
                    <p className="text-green-600">Total</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6 text-center">
                    <p className="text-3xl font-bold text-blue-700">
                      {platformAnalytics?.analytics.restaurants.active || 0}
                    </p>
                    <p className="text-blue-600">Active</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-6 text-center">
                    <p className="text-3xl font-bold text-purple-700">
                      {platformAnalytics?.analytics.restaurants.verified || 0}
                    </p>
                    <p className="text-purple-600">Verified</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

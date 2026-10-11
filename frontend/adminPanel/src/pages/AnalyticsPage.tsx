"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Store,
  Truck,
  Package,
  Calendar,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { PlatformAnalytics, SalesAnalytics, UserAnalytics } from "@/types";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Platform performance and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {platformAnalytics && !isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold">
                    {platformAnalytics.analytics.users.total.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="mt-2 text-sm text-green-600">
                +{platformAnalytics.analytics.users.new} this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Restaurants
                  </p>
                  <p className="text-2xl font-bold">
                    {platformAnalytics.analytics.restaurants.total.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <Store className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="mt-2 text-sm text-green-600">
                {platformAnalytics.analytics.restaurants.active} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Riders
                  </p>
                  <p className="text-2xl font-bold">N/A</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                  <Truck className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Data not available
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Orders
                  </p>
                  <p className="text-2xl font-bold">
                    {platformAnalytics.analytics.orders.total.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="mt-2 text-sm text-green-600">
                {platformAnalytics.analytics.orders.recent} recent
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold">
                    $
                    {platformAnalytics.analytics.revenue.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <p className="mt-2 text-sm text-green-600">
                $
                {platformAnalytics.analytics.revenue.recentRevenue.toLocaleString()}{" "}
                recent
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg Order Value
                  </p>
                  <p className="text-2xl font-bold">
                    $
                    {platformAnalytics.analytics.orders.total > 0
                      ? (
                          platformAnalytics.analytics.revenue.totalRevenue /
                          platformAnalytics.analytics.orders.total
                        ).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100">
                  <BarChart3 className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
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
              <div className="h-80 flex items-end justify-around p-4">
                {salesAnalytics?.salesOverTime?.map((day) => (
                  <div
                    key={day._id}
                    className="flex flex-col items-center gap-2 w-full"
                  >
                    <div
                      className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                      style={{
                        height: `${salesAnalytics.salesOverTime.length > 0 ? (day.revenue / Math.max(...salesAnalytics.salesOverTime.map((d) => d.revenue))) * 100 : 0}%`,
                      }}
                      title={`$${day.revenue.toLocaleString()}`}
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
                        {r.restaurant?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {r.orders.toLocaleString()} orders
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${r.revenue.toLocaleString()}
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

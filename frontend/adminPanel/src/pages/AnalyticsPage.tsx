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
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalRestaurants: number;
    totalRiders: number;
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
  sales: { date: string; orders: number; revenue: number }[];
  users: { date: string; newUsers: number; activeUsers: number }[];
  topRestaurants: {
    id: string;
    name: string;
    orders: number;
    revenue: number;
  }[];
  topCategories: { category: string; orders: number; revenue: number }[];
}

export function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await api.getPlatformAnalytics();
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics",
        variant: "destructive",
      });
      // Mock data for demo
      setAnalytics({
        overview: {
          totalUsers: 12345,
          totalRestaurants: 567,
          totalRiders: 89,
          totalOrders: 45678,
          totalRevenue: 1234567,
          avgOrderValue: 27.03,
        },
        sales: Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), "yyyy-MM-dd"),
          orders: Math.floor(Math.random() * 200) + 50,
          revenue: Math.floor(Math.random() * 5000) + 1000,
        })),
        users: Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), "yyyy-MM-dd"),
          newUsers: Math.floor(Math.random() * 20) + 5,
          activeUsers: Math.floor(Math.random() * 500) + 100,
        })),
        topRestaurants: [
          { id: "1", name: "Pizza Palace", orders: 1234, revenue: 45670 },
          { id: "2", name: "Burger Barn", orders: 987, revenue: 34560 },
          { id: "3", name: "Sushi Central", orders: 876, revenue: 52340 },
          { id: "4", name: "Taco Town", orders: 654, revenue: 23450 },
          { id: "5", name: "Pasta Place", orders: 543, revenue: 29870 },
        ],
        topCategories: [
          { category: "Pizza", orders: 15678, revenue: 456780 },
          { category: "Burger", orders: 12345, revenue: 345670 },
          { category: "Sushi", orders: 9876, revenue: 523450 },
          { category: "Pasta", orders: 8765, revenue: 298760 },
          { category: "Salad", orders: 5432, revenue: 123450 },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const now = new Date();
    switch (range) {
      case "7d":
        setStartDate(format(subDays(now, 7), "yyyy-MM-dd"));
        break;
      case "30d":
        setStartDate(format(subDays(now, 30), "yyyy-MM-dd"));
        break;
      case "90d":
        setStartDate(format(subDays(now, 90), "yyyy-MM-dd"));
        break;
      case "1y":
        setStartDate(format(subDays(now, 365), "yyyy-MM-dd"));
        break;
    }
    setEndDate(format(now, "yyyy-MM-dd"));
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
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics?.overview?.totalUsers.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="mt-2 text-sm text-green-600">
                +12.5% vs last period
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
                    {analytics?.overview?.totalRestaurants.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <Store className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="mt-2 text-sm text-green-600">
                +8.2% vs last period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Riders
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics?.overview?.totalRiders.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                  <Truck className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="mt-2 text-sm text-green-600">
                +5.1% vs last period
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
                    {analytics?.overview?.totalOrders.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="mt-2 text-sm text-green-600">
                +15.3% vs last period
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
                    ${analytics?.overview?.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <p className="mt-2 text-sm text-green-600">
                +22.1% vs last period
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
                    ${analytics?.overview?.avgOrderValue.toFixed(2)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100">
                  <BarChart3 className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
              <p className="mt-2 text-sm text-green-600">
                +3.2% vs last period
              </p>
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
                <CardTitle>Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-end justify-around p-4">
                  {analytics?.sales?.slice(-14).map((day) => (
                    <div
                      key={day.date}
                      className="flex flex-col items-center gap-2 w-full"
                    >
                      <div
                        className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                        style={{
                          height: `${Math.max(5, (day.revenue / (Math.max(...analytics?.sales.map((d) => d.revenue)) || 1)) * 100)}%`,
                        }}
                        title={`$${day.revenue.toLocaleString()}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(day.date), "MMM dd")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-end justify-around p-4">
                  {analytics?.users?.slice(-14).map((day) => (
                    <div
                      key={day.date}
                      className="flex flex-col items-center gap-2 w-full"
                    >
                      <div
                        className="w-full bg-green-500 rounded-t transition-all hover:bg-green-500/80"
                        style={{
                          height: `${Math.max(5, (day.newUsers / (Math.max(...analytics?.users.map((d) => d.newUsers)) || 1)) * 100)}%`,
                        }}
                        title={day.newUsers.toString()}
                      />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(day.date), "MMM dd")}
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
              <CardTitle>Sales Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Date</th>
                      <th className="text-left p-4">Orders</th>
                      <th className="text-left p-4">Revenue</th>
                      <th className="text-left p-4">Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.sales
                      ?.slice(-30)
                      .reverse()
                      .map((day) => (
                        <tr key={day.date} className="border-b">
                          <td className="p-4">
                            {format(new Date(day.date), "MMM dd, yyyy")}
                          </td>
                          <td className="p-4">{day.orders.toLocaleString()}</td>
                          <td className="p-4 font-medium">
                            ${day.revenue.toLocaleString()}
                          </td>
                          <td className="p-4">
                            $
                            {(day.revenue / Math.max(day.orders, 1)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Date</th>
                      <th className="text-left p-4">New Users</th>
                      <th className="text-left p-4">Active Users</th>
                      <th className="text-left p-4">Retention Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.users
                      ?.slice(-30)
                      .reverse()
                      .map((day) => (
                        <tr key={day.date} className="border-b">
                          <td className="p-4">
                            {format(new Date(day.date), "MMM dd, yyyy")}
                          </td>
                          <td className="p-4">{day.newUsers}</td>
                          <td className="p-4">{day.activeUsers}</td>
                          <td className="p-4">
                            {(
                              (day.activeUsers /
                                Math.max(day.newUsers * 7, 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restaurants">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Restaurants by Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topRestaurants?.map((restaurant, index) => (
                    <div
                      key={restaurant.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {restaurant.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {restaurant.orders.toLocaleString()} orders
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${restaurant.revenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Categories by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topCategories?.map((cat, index) => (
                    <div
                      key={cat.category}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{cat.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {cat.orders.toLocaleString()} orders
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${cat.revenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

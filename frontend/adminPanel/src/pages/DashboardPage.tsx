"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Store,
  Truck,
  Package,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import type { Analytics } from "@/types";
import { cn } from "@/lib/utils";

const statCards = [
  { name: "Total Users", icon: Users, color: "bg-blue-500", href: "/users" },
  {
    name: "Total Restaurants",
    icon: Store,
    color: "bg-green-500",
    href: "/restaurants",
  },
  {
    name: "Active Riders",
    icon: Truck,
    color: "bg-orange-500",
    href: "/riders",
  },
  {
    name: "Total Orders",
    icon: Package,
    color: "bg-purple-500",
    href: "/orders",
  },
  {
    name: "Total Revenue",
    icon: DollarSign,
    color: "bg-emerald-500",
    href: "/analytics",
  },
  {
    name: "Pending Payments",
    icon: CreditCard,
    color: "bg-yellow-500",
    href: "/payments",
  },
];

export function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([
    { value: "-", change: "+0%", trend: "up" },
    { value: "-", change: "+0%", trend: "up" },
    { value: "-", change: "+0%", trend: "up" },
    { value: "-", change: "+0%", trend: "up" },
    { value: "-", change: "+0%", trend: "up" },
    { value: "-", change: "+0%", trend: "up" },
  ]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.getPlatformAnalytics();
        if (response.success && response.data) {
          setAnalytics(response.data);
          setStats([
            {
              value: response.data.overview.totalUsers.toLocaleString(),
              change: "+12%",
              trend: "up",
            },
            {
              value: response.data.overview.totalRestaurants.toLocaleString(),
              change: "+8%",
              trend: "up",
            },
            {
              value: response.data.overview.totalRiders.toLocaleString(),
              change: "+5%",
              trend: "up",
            },
            {
              value: response.data.overview.totalOrders.toLocaleString(),
              change: "+15%",
              trend: "up",
            },
            {
              value: `$${response.data.overview.totalRevenue.toLocaleString()}`,
              change: "+22%",
              trend: "up",
            },
            { value: "$0", change: "-3%", trend: "down" },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        // Set mock data for demo
        setStats([
          { value: "12,345", change: "+12%", trend: "up" },
          { value: "567", change: "+8%", trend: "up" },
          { value: "89", change: "+5%", trend: "up" },
          { value: "45,678", change: "+15%", trend: "up" },
          { value: "$1,234,567", change: "+22%", trend: "up" },
          { value: "$12,345", change: "-3%", trend: "down" },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your NutriDeliver platform
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card, index) => (
          <Link key={card.name} to={card.href} className="group">
            <Card className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.name}
                    </p>
                    <p
                      className={cn(
                        "text-2xl font-bold",
                        isLoading ? "animate-pulse" : "",
                      )}
                    >
                      {stats[index]?.value || "-"}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      card.color,
                    )}
                  >
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1">
                  <Badge
                    variant={
                      stats[index]?.trend === "up" ? "success" : "destructive"
                    }
                    className="text-xs"
                  >
                    {stats[index]?.trend === "up" ? (
                      <>
                        <ArrowUpRight className="h-3 w-3 mr-1" />{" "}
                        {stats[index]?.change}
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-3 w-3 mr-1" />{" "}
                        {stats[index]?.change}
                      </>
                    )}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    vs last month
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: "#ORD-001",
                  customer: "John Doe",
                  restaurant: "Pizza Palace",
                  amount: "$45.50",
                  status: "delivered",
                },
                {
                  id: "#ORD-002",
                  customer: "Jane Smith",
                  restaurant: "Burger Barn",
                  amount: "$32.00",
                  status: "out_for_delivery",
                },
                {
                  id: "#ORD-003",
                  customer: "Bob Wilson",
                  restaurant: "Sushi Central",
                  amount: "$67.80",
                  status: "preparing",
                },
                {
                  id: "#ORD-004",
                  customer: "Alice Brown",
                  restaurant: "Taco Town",
                  amount: "$28.90",
                  status: "confirmed",
                },
                {
                  id: "#ORD-005",
                  customer: "Charlie Davis",
                  restaurant: "Pasta Place",
                  amount: "$54.20",
                  status: "pending",
                },
              ].map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer} • {order.restaurant}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.amount}</p>
                    <Badge
                      variant={getStatusVariant(order.status)}
                      className="text-xs mt-1"
                    >
                      {formatStatus(order.status)}
                    </Badge>
                  </div>
                </Link>
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
              {[
                {
                  name: "Pizza Palace",
                  orders: 1234,
                  revenue: "$45,670",
                  rating: 4.8,
                },
                {
                  name: "Burger Barn",
                  orders: 987,
                  revenue: "$34,560",
                  rating: 4.6,
                },
                {
                  name: "Sushi Central",
                  orders: 876,
                  revenue: "$52,340",
                  rating: 4.9,
                },
                {
                  name: "Taco Town",
                  orders: 654,
                  revenue: "$23,450",
                  rating: 4.5,
                },
                {
                  name: "Pasta Place",
                  orders: 543,
                  revenue: "$29,870",
                  rating: 4.7,
                },
              ].map((restaurant, index) => (
                <div
                  key={restaurant.name}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{restaurant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {restaurant.orders} orders • {restaurant.revenue}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{restaurant.rating}</p>
                    <p className="text-xs text-muted-foreground">★★★★★</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-around p-4">
              {[
                { label: "Mon", value: 65 },
                { label: "Tue", value: 45 },
                { label: "Wed", value: 78 },
                { label: "Thu", value: 56 },
                { label: "Fri", value: 89 },
                { label: "Sat", value: 92 },
                { label: "Sun", value: 71 },
              ].map((day) => (
                <div
                  key={day.label}
                  className="flex flex-col items-center gap-2 w-full"
                >
                  <div
                    className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                    style={{ height: `${day.value}%` }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { status: "Delivered", count: 1234, color: "bg-green-500" },
                { status: "Out for Delivery", count: 56, color: "bg-blue-500" },
                { status: "Preparing", count: 78, color: "bg-yellow-500" },
                { status: "Confirmed", count: 134, color: "bg-purple-500" },
                { status: "Pending", count: 45, color: "bg-gray-500" },
                { status: "Cancelled", count: 23, color: "bg-red-500" },
              ].map((item) => (
                <div key={item.status} className="flex items-center gap-3">
                  <div className={cn("h-2 w-20 rounded", item.color)} />
                  <span className="text-sm font-medium w-24">
                    {item.status}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getStatusVariant(status: string) {
  switch (status) {
    case "delivered":
      return "success";
    case "out_for_delivery":
      return "info";
    case "preparing":
      return "warning";
    case "confirmed":
      return "default";
    case "pending":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "default";
  }
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

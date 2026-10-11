import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_COLORS, formatStatus } from "@/features/orders";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus, SalesAnalytics } from "@/types";
import { toStatusBreakdown } from "./useDashboardData";

function PanelEmpty({ message }: { message: string }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">{message}</p>
  );
}

function customerName(order: Order): string {
  return typeof order.userId === "object" && order.userId.profile
    ? `${order.userId.profile.firstName} ${order.userId.profile.lastName}`
    : "Unknown customer";
}

function restaurantName(order: Order): string {
  return typeof order.restaurantId === "object" && order.restaurantId?.name
    ? order.restaurantId.name
    : "Unknown restaurant";
}

export interface RecentOrdersCardProps {
  orders: Order[];
  isLoading: boolean;
}

export function RecentOrdersCard({ orders, isLoading }: RecentOrdersCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/orders">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <PanelEmpty message="No orders yet" />
        ) : (
          <ul className="divide-y divide-border">
            {orders.map((order) => (
              <li key={order._id}>
                <Link
                  to="/orders"
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium">
                      {order.orderId}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {customerName(order)} · {restaurantName(order)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium">
                      ${order.grandTotal?.toFixed(2) ?? "0.00"}
                    </p>
                    <Badge
                      variant={ORDER_STATUS_COLORS[order.status] ?? "default"}
                      className="mt-1 text-xs"
                    >
                      {formatStatus(order.status)}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export interface TopRestaurantsCardProps {
  sales: SalesAnalytics | null;
  isLoading: boolean;
}

export function TopRestaurantsCard({
  sales,
  isLoading,
}: TopRestaurantsCardProps) {
  const top = sales?.topRestaurants?.slice(0, 5) ?? [];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Top Restaurants</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/restaurants">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : top.length === 0 ? (
          <PanelEmpty message="No sales recorded in this period" />
        ) : (
          <ol className="divide-y divide-border">
            {top.map((entry, index) => (
              <li
                key={entry._id}
                className="flex items-center gap-3 rounded-lg px-3 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {entry.restaurant?.name ?? "Deleted restaurant"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entry.orderCount} orders · ${entry.totalSales.toFixed(2)}
                  </p>
                </div>
                {typeof entry.restaurant?.rating === "number" &&
                  entry.restaurant.rating > 0 && (
                    <div className="flex shrink-0 items-center gap-1 text-sm font-medium">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {entry.restaurant.rating.toFixed(1)}
                    </div>
                  )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted-foreground/50",
  confirmed: "bg-violet-500",
  preparing: "bg-amber-500",
  ready_for_pickup: "bg-cyan-500",
  pickedup: "bg-sky-500",
  out_for_delivery: "bg-blue-500",
  delivered: "bg-fresh-500",
  cancelled: "bg-destructive",
};

export interface OrderStatusCardProps {
  byStatus: { _id: OrderStatus; count: number }[] | undefined;
  isLoading: boolean;
}

export function OrderStatusCard({ byStatus, isLoading }: OrderStatusCardProps) {
  const breakdown = toStatusBreakdown(byStatus);
  const total = breakdown.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Order Status</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : breakdown.length === 0 ? (
          <PanelEmpty message="No orders to summarise" />
        ) : (
          <ul className="space-y-3">
            {breakdown.map(({ status, count }) => (
              <li key={status} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{formatStatus(status)}</span>
                  <span className="text-muted-foreground">
                    {count.toLocaleString()} ·{" "}
                    {total > 0 ? Math.round((count / total) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      STATUS_COLORS[status] ?? "bg-primary",
                    )}
                    style={{
                      width: `${total > 0 ? (count / total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export interface SalesOverviewCardProps {
  sales: SalesAnalytics | null;
  isLoading: boolean;
}

export function SalesOverviewCard({
  sales,
  isLoading,
}: SalesOverviewCardProps) {
  const points = sales?.salesOverTime ?? [];
  const max = Math.max(...points.map((p) => p.dailySales), 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Sales Overview</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : points.length === 0 ? (
          <PanelEmpty message="No paid orders in this period" />
        ) : (
          <div className="flex h-64 items-end gap-1.5 overflow-x-auto pt-4">
            {points.map((point) => (
              <div
                key={point._id}
                className="group flex min-w-[28px] flex-1 flex-col items-center justify-end gap-2"
                title={`${point._id}: $${point.dailySales.toFixed(2)} across ${point.orderCount} orders`}
              >
                <div
                  className="w-full rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
                  style={{
                    height: `${
                      max > 0 ? Math.max((point.dailySales / max) * 100, 2) : 2
                    }%`,
                  }}
                />
                <span className="rotate-45 whitespace-nowrap text-[10px] text-muted-foreground">
                  {point._id.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

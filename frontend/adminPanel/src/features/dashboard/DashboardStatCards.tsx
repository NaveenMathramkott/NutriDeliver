import { Link } from "react-router-dom";
import {
  Users,
  Store,
  Truck,
  Package,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PlatformAnalytics } from "@/types";
import type { DashboardData } from "./useDashboardData";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href: string;
  isLoading?: boolean;
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  color,
  href,
  isLoading,
}: StatCardProps) {
  return (
    <Link
      to={href}
      className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
    >
      <Card className="h-full transition-all group-hover:shadow-md">
        <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-sm text-muted-foreground">{label}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="truncate text-2xl font-bold tracking-tight">
                  {value}
                </p>
              )}
            </div>
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                color,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>
          {hint && !isLoading && (
            <p className="text-sm text-muted-foreground">{hint}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export interface DashboardStatCardsProps {
  data: DashboardData;
  isLoading: boolean;
}

const RIDER_COLOR =
  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";

export function DashboardStatCards({
  data,
  isLoading,
}: DashboardStatCardsProps) {
  const analytics: PlatformAnalytics | null = data.analytics;
  const users = analytics?.analytics.users;
  const restaurants = analytics?.analytics.restaurants;
  const orders = analytics?.analytics.orders;
  const revenue = analytics?.analytics.revenue;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label="Total Users"
        icon={Users}
        color="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
        href="/users"
        isLoading={isLoading}
        value={users ? users.total.toLocaleString() : "—"}
        hint={
          users ? `${users.new} new in last 30 days` : "Analytics unavailable"
        }
      />

      <StatCard
        label="Total Restaurants"
        icon={Store}
        color="bg-fresh-100 text-fresh-700 dark:bg-fresh-500/15 dark:text-fresh-400"
        href="/restaurants"
        isLoading={isLoading}
        value={restaurants ? restaurants.total.toLocaleString() : "—"}
        hint={
          restaurants
            ? `${restaurants.active} active · ${restaurants.verified} verified`
            : "Analytics unavailable"
        }
      />

      <StatCard
        label="Total Riders"
        icon={Truck}
        color={RIDER_COLOR}
        href="/riders"
        isLoading={isLoading}
        value={data.totalRiders.toLocaleString()}
        hint="All registered riders"
      />

      <StatCard
        label="Total Orders"
        icon={Package}
        color="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400"
        href="/orders"
        isLoading={isLoading}
        value={orders ? orders.total.toLocaleString() : "—"}
        hint={
          orders ? `${orders.recent} in last 30 days` : "Analytics unavailable"
        }
      />

      <StatCard
        label="Total Revenue"
        icon={DollarSign}
        color="bg-primary/10 text-primary"
        href="/analytics"
        isLoading={isLoading}
        value={revenue ? `$${revenue.totalRevenue.toLocaleString()}` : "—"}
        hint={
          revenue
            ? `$${revenue.recentRevenue.toLocaleString()} in last 30 days`
            : "Analytics unavailable"
        }
      />

      <StatCard
        label="Pending Payments"
        icon={CreditCard}
        color="bg-nutrideliver-100 text-nutrideliver-700 dark:bg-nutrideliver-500/15 dark:text-nutrideliver-300"
        href="/payments"
        isLoading={isLoading}
        value={data.totalPendingPayments.toLocaleString()}
        hint="Awaiting settlement"
      />
    </div>
  );
}

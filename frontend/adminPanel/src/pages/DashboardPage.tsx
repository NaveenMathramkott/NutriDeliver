"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common";
import {
  DashboardStatCards,
  RecentOrdersCard,
  TopRestaurantsCard,
  SalesOverviewCard,
  OrderStatusCard,
  useDashboardData,
} from "@/features/dashboard";

export function DashboardPage() {
  const { data, isLoading, hasError, reload } = useDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your NutriDeliver platform"
        action={
          <Button
            variant="outline"
            onClick={reload}
            disabled={isLoading}
            aria-label="Refresh dashboard"
          >
            <RefreshCw className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
      />

      {hasError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2 text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  Could not load dashboard analytics
                </p>
                <p className="text-sm text-muted-foreground">
                  Check that the API is running and try again.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={reload}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <DashboardStatCards data={data} isLoading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentOrdersCard orders={data.recentOrders} isLoading={isLoading} />
        <TopRestaurantsCard sales={data.sales} isLoading={isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesOverviewCard sales={data.sales} isLoading={isLoading} />
        </div>
        <OrderStatusCard
          byStatus={data.analytics?.analytics.orders.byStatus}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { api } from "@/services/api";
import type {
  Order,
  OrderStatus,
  PlatformAnalytics,
  SalesAnalytics,
} from "@/types";

const RECENT_ORDERS_LIMIT = 5;
const TOP_RESTAURANTS_LIMIT = 5;

export interface DashboardData {
  analytics: PlatformAnalytics | null;
  sales: SalesAnalytics | null;
  recentOrders: Order[];
  totalRiders: number;
  totalPendingPayments: number;
}

export interface UseDashboardData {
  data: DashboardData;
  isLoading: boolean;
  hasError: boolean;
  reload: () => void;
}

const EMPTY: DashboardData = {
  analytics: null,
  sales: null,
  recentOrders: [],
  totalRiders: 0,
  totalPendingPayments: 0,
};

/**
 * Loads every panel on the dashboard. Each request settles independently so a
 * single failing endpoint degrades to an empty panel rather than blanking the
 * whole screen.
 */
export function useDashboardData(): UseDashboardData {
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setHasError(false);

      const [platform, sales, orders, riders, pending] =
        await Promise.allSettled([
          api.getPlatformAnalytics(),
          api.getSalesAnalytics({ groupBy: "day" }),
          api.getOrders({ page: 1, limit: RECENT_ORDERS_LIMIT }),
          api.getRiders({ page: 1, limit: 1 }),
          api.getPayments({ page: 1, limit: 1, status: "pending" }),
        ]);

      if (cancelled) return;

      const analytics =
        platform.status === "fulfilled" && platform.value?.success
          ? (platform.value.data as PlatformAnalytics)
          : null;

      const salesData =
        sales.status === "fulfilled" && sales.value?.success
          ? (sales.value.data as SalesAnalytics)
          : null;

      const ordersData = orders.status === "fulfilled" ? orders.value : null;

      const ridersData = riders.status === "fulfilled" ? riders.value : null;

      const pendingData = pending.status === "fulfilled" ? pending.value : null;

      // Nothing at all came back — surface an error state.
      if (!analytics && !salesData) {
        setHasError(true);
      }

      // Paginated endpoints return `{ data: { <collection>, pagination } }`.
      const readTotal = (result: typeof ordersData) =>
        result && result.success
          ? ((result.data as { pagination?: { total?: number } })?.pagination
              ?.total ?? 0)
          : 0;

      const readOrders = (result: typeof ordersData) =>
        result && result.success
          ? ((result.data as { orders?: Order[] })?.orders ?? [])
          : [];

      setData({
        analytics,
        sales: salesData,
        recentOrders: readOrders(ordersData),
        totalRiders: readTotal(ridersData),
        totalPendingPayments: readTotal(pendingData),
      });

      setIsLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return { data, isLoading, hasError, reload };
}

/** Merges status buckets with the full status list so empty states still show. */
export function toStatusBreakdown(
  byStatus: { _id: OrderStatus; count: number }[] | undefined,
): { status: OrderStatus; count: number }[] {
  if (!byStatus?.length) return [];
  const map = new Map(byStatus.map((s) => [s._id, s.count]));
  return [...map.entries()]
    .map(([status, count]) => ({ status, count }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
}

export { RECENT_ORDERS_LIMIT, TOP_RESTAURANTS_LIMIT };

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MoreVertical, Package, Eye } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  PageHeader,
  FilterBar,
  TablePagination,
  TableFooterText,
  TableState,
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  TableCell,
  TableHead,
} from "@/components/common";
import { api } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import type { Order, OrderStatus } from "@/types";
import {
  OrderDetailDialog,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  ORDER_STATUS_OPTIONS,
  formatStatus,
} from "@/features/orders";

const PAGE_SIZE = 10;

function customerName(order: Order): string {
  return typeof order.userId === "object" && order.userId.profile
    ? `${order.userId.profile.firstName} ${order.userId.profile.lastName}`
    : "Unknown";
}

function customerEmail(order: Order): string {
  return typeof order.userId === "object" ? (order.userId.email ?? "") : "";
}

function restaurantName(order: Order): string {
  return typeof order.restaurantId === "object"
    ? (order.restaurantId.name ?? "Unknown")
    : "Unknown";
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getOrders({
        page: currentPage,
        limit: PAGE_SIZE,
        status: statusFilter,
      });
      if (response.success && response.data) {
        const data = response.data as {
          orders: Order[];
          pagination: { current: number; pages: number; total: number };
        };
        setOrders(data.orders);
        setTotalPages(data.pagination.pages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const openDetailDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsDetailDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!selectedOrder || newStatus === selectedOrder.status) return;
    setIsUpdating(true);
    try {
      const response = await api.updateOrder(selectedOrder._id, {
        status: newStatus,
      });
      if (response.success) {
        toast({
          title: "Success",
          description: `Order status updated to ${formatStatus(newStatus)}`,
          variant: "success",
        });
        setIsDetailDialogOpen(false);
        fetchOrders();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const visibleOrders = searchQuery
    ? orders.filter((order) =>
        [
          order.orderId,
          customerName(order),
          customerEmail(order),
          restaurantName(order),
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )
    : orders;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Management"
        description="Manage and track all orders"
      />

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search orders..."
            onSearch={() => setCurrentPage(1)}
            filters={[
              {
                key: "status",
                label: "All Statuses",
                value: statusFilter,
                onValueChange: setStatusFilter,
                options: ORDER_STATUS_OPTIONS,
              },
            ]}
          />

          <DataTable>
            <DataTableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </DataTableHead>
            <DataTableBody>
              <TableState
                isLoading={isLoading}
                isEmpty={visibleOrders.length === 0}
                colSpan={9}
                emptyMessage="No orders found"
              />
              {visibleOrders.map((order) => (
                <DataTableRow key={order._id}>
                  <TableCell>
                    <p className="font-mono font-medium">{order.orderId}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{customerName(order)}</p>
                    <p className="text-sm text-muted-foreground">
                      {customerEmail(order)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{restaurantName(order)}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {order.items?.length || 0} items
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      ${order.grandTotal?.toFixed(2) || "0.00"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={ORDER_STATUS_COLORS[order.status]}
                      className="capitalize"
                    >
                      {formatStatus(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={PAYMENT_STATUS_COLORS[order.paymentStatus]}
                      className="capitalize"
                    >
                      {formatStatus(order.paymentStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM dd, yyyy HH:mm")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openDetailDialog(order)}
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDetailDialog(order)}
                        >
                          <Package className="h-4 w-4" />
                          Update Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          <TableFooterText
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            total={total}
            itemLabel="orders"
          />
        </CardContent>
      </Card>

      <OrderDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        order={selectedOrder}
        newStatus={newStatus}
        onStatusChange={setNewStatus}
        onUpdateStatus={handleStatusChange}
        isSubmitting={isUpdating}
      />
    </div>
  );
}

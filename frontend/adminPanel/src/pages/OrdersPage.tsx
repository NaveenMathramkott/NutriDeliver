"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  MoreVertical,
  Package,
  Truck,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  DollarSign,
  MapPin as MapPinIcon,
  User,
  ChefHat,
  Bike,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus, PaymentStatus } from "@/types";

const statusColors: Record<
  OrderStatus,
  "default" | "success" | "warning" | "destructive" | "secondary" | "info"
> = {
  pending: "warning",
  confirmed: "info",
  preparing: "warning",
  ready_for_pickup: "info",
  pickedup: "info",
  out_for_delivery: "info",
  delivered: "success",
  cancelled: "destructive",
};

const paymentStatusColors: Record<
  PaymentStatus,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  pending: "warning",
  paid: "success",
  failed: "destructive",
  refunded: "secondary",
};

const statusOrder: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "pickedup",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

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
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await api.getOrders({
        page: currentPage,
        limit: 10,
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
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchQuery, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  const openDetailDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!selectedOrder || !newStatus) return;
    try {
      const response = await api.updateOrder(selectedOrder._id, {
        status: newStatus,
      });
      if (response.success) {
        toast({
          title: "Success",
          description: `Order status updated to ${newStatus.replace("_", " ")}`,
          variant: "success",
        });
        fetchOrders();
        setIsDetailDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getValidNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === statusOrder.length - 1)
      return [];
    return statusOrder.slice(currentIndex + 1, currentIndex + 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Order Management
          </h1>
          <p className="text-muted-foreground">Manage and track all orders</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-4 flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {statusOrder.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>
                        <p className="font-mono font-medium">{order.orderId}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {typeof order.userId === "object" &&
                            order.userId.profile
                              ? `${order.userId.profile.firstName} ${order.userId.profile.lastName}`
                              : "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.userId && typeof order.userId === "object"
                              ? order.userId.email
                              : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {typeof order.restaurantId === "object"
                            ? order.restaurantId.name
                            : "Unknown"}
                        </p>
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
                          variant={statusColors[order.status] || "default"}
                          className="capitalize"
                        >
                          {order.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            paymentStatusColors[order.paymentStatus] ||
                            "default"
                          }
                          className="capitalize"
                        >
                          {order.paymentStatus.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(
                            new Date(order.createdAt),
                            "MMM dd, yyyy HH:mm",
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openDetailDialog(order)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                setNewStatus(order.status);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              <Package className="mr-2 h-4 w-4" />
                              Update Status
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={currentPage === pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 10 + 1} to{" "}
            {Math.min(currentPage * 10, total)} of {total} orders
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.orderId}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">
                    {typeof selectedOrder.userId === "object" &&
                    selectedOrder.userId.profile
                      ? `${selectedOrder.userId.profile.firstName} ${selectedOrder.userId.profile.lastName}`
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">
                    {typeof selectedOrder.userId === "object"
                      ? selectedOrder.userId.email
                      : ""}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Restaurant</p>
                  <p className="font-medium">
                    {typeof selectedOrder.restaurantId === "object"
                      ? selectedOrder.restaurantId.name
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rider</p>
                  <p className="font-medium">
                    {typeof selectedOrder.riderId === "object" &&
                    selectedOrder.riderId.profile
                      ? `${selectedOrder.riderId.profile.firstName} ${selectedOrder.riderId.profile.lastName}`
                      : selectedOrder.riderId
                        ? "Assigned"
                        : "Not assigned"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Delivery Address</p>
                  <p className="font-medium">
                    {selectedOrder.deliveryAddress.street},{" "}
                    {selectedOrder.deliveryAddress.city},{" "}
                    {selectedOrder.deliveryAddress.state}{" "}
                    {selectedOrder.deliveryAddress.zipCode}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-medium capitalize">
                    {selectedOrder.paymentMethod}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Status</p>
                  <Badge
                    variant={
                      paymentStatusColors[selectedOrder.paymentStatus] ||
                      "default"
                    }
                    className="capitalize"
                  >
                    {selectedOrder.paymentStatus.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="col-span-2 border-t pt-2">
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Subtotal</p>
                      <p className="font-medium">
                        ${selectedOrder.orderTotal?.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Delivery Fee</p>
                      <p className="font-medium">
                        ${selectedOrder.deliveryFee?.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tax</p>
                      <p className="font-medium">
                        ${selectedOrder.tax?.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Grand Total</p>
                      <p className="font-bold text-lg">
                        ${selectedOrder.grandTotal?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label>Update Status</Label>
                <Select
                  value={newStatus}
                  onValueChange={(value: OrderStatus) => setNewStatus(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {getValidNextStatuses(selectedOrder.status).map(
                      (status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, " ")}
                        </SelectItem>
                      ),
                    )}
                    {selectedOrder.status !== "cancelled" && (
                      <SelectItem value="cancelled">Cancel Order</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={
                          item.foodItemId && typeof item.foodItemId === "object"
                            ? item.foodItemId._id
                            : item.foodItemId || item.name
                        }
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                          {item.specialInstructions && (
                            <p className="text-xs text-muted-foreground">
                              {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <p className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.appliedOffer && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-800">
                    <strong>Offer Applied:</strong>{" "}
                    {selectedOrder.appliedOffer.code} - $
                    {selectedOrder.appliedOffer.discountAmount.toFixed(2)} off
                  </p>
                </div>
              )}

              {selectedOrder.deliveryDetails && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Delivery Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">
                        Estimated Delivery
                      </p>
                      <p>
                        {selectedOrder.estimatedDelivery
                          ? format(
                              new Date(selectedOrder.estimatedDelivery),
                              "MMM dd, yyyy HH:mm",
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Preparation Time</p>
                      <p>{selectedOrder.preparationTime} min</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Assigned At</p>
                      <p>
                        {selectedOrder.deliveryDetails.assignedAt
                          ? format(
                              new Date(
                                selectedOrder.deliveryDetails.assignedAt,
                              ),
                              "MMM dd, yyyy HH:mm",
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Picked Up At</p>
                      <p>
                        {selectedOrder.deliveryDetails.pickedUpAt
                          ? format(
                              new Date(
                                selectedOrder.deliveryDetails.pickedUpAt,
                              ),
                              "MMM dd, yyyy HH:mm",
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Delivered At</p>
                      <p>
                        {selectedOrder.deliveryDetails.deliveredAt
                          ? format(
                              new Date(
                                selectedOrder.deliveryDetails.deliveredAt,
                              ),
                              "MMM dd, yyyy HH:mm",
                            )
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={!newStatus || newStatus === selectedOrder?.status}
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

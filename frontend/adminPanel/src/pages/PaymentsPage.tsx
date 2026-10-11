"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  MoreVertical,
  CreditCard,
  DollarSign,
  RotateCcw,
  Eye,
  AlertCircle,
  CheckCircle2,
  Filter,
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
import type { Order, PaymentStatus, PaymentMethod } from "@/types";

const statusColors: Record<
  PaymentStatus,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  pending: "warning",
  paid: "success",
  failed: "destructive",
  refunded: "secondary",
};

const methodColors: Record<
  PaymentMethod,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  card: "default",
  cash: "secondary",
  digital_wallet: "success",
};

export function PaymentsPage() {
  const [payments, setPayments] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await api.getPayments({
        page: currentPage,
        limit: 10,
        status: statusFilter,
        method: methodFilter,
      });
      if (response.success && response.data) {
        const data = response.data as {
          payments: Order[];
          pagination: { current: number; pages: number; total: number };
        };
        setPayments(data.payments);
        setTotalPages(data.pagination.pages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage, searchQuery, statusFilter, methodFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPayments();
  };

  const openDetailDialog = (payment: Order) => {
    setSelectedPayment(payment);
    setIsDetailDialogOpen(true);
  };

  const openRefundDialog = (payment: Order) => {
    setSelectedPayment(payment);
    setRefundAmount(payment.grandTotal.toString());
    setRefundReason("");
    setIsRefundDialogOpen(true);
  };

  const handleRefund = async () => {
    if (!selectedPayment || !refundAmount || !refundReason) return;
    try {
      const response = await api.refundPayment(
        selectedPayment._id,
        parseFloat(refundAmount),
        refundReason,
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Refund processed successfully",
          variant: "success",
        });
        fetchPayments();
        setIsRefundDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Payment Management
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage all payments
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  $
                  {payments
                    .filter((p) => p.paymentStatus === "paid")
                    .reduce((sum, p) => sum + p.grandTotal, 0)
                    .toFixed(2)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-green-600">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Pending Payments
                </p>
                <p className="text-2xl font-bold">
                  $
                  {payments
                    .filter((p) => p.paymentStatus === "pending")
                    .reduce((sum, p) => sum + p.grandTotal, 0)
                    .toFixed(2)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-yellow-600">
              {payments.filter((p) => p.paymentStatus === "pending").length}{" "}
              pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Refunds</p>
                <p className="text-2xl font-bold">
                  $
                  {payments
                    .filter((p) => p.paymentStatus === "refunded")
                    .reduce((sum, p) => sum + p.grandTotal, 0)
                    .toFixed(2)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                <RotateCcw className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-red-600">
              {payments.filter((p) => p.paymentStatus === "refunded").length}{" "}
              refunded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {payments.length > 0
                    ? (
                        (payments.filter((p) => p.paymentStatus === "paid")
                          .length /
                          payments.length) *
                        100
                      ).toFixed(1)
                    : "100"}
                  %
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-blue-600">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-4 flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Methods</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
              </SelectContent>
            </Select>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>
                        <p className="font-mono text-sm">{payment.orderId}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {typeof payment.userId === "object" &&
                          payment.userId.profile
                            ? `${payment.userId.profile.firstName} ${payment.userId.profile.lastName}`
                            : "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {typeof payment.userId === "object"
                            ? payment.userId.email
                            : ""}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          ${payment.grandTotal?.toFixed(2)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            methodColors[payment.paymentMethod] || "default"
                          }
                          className="capitalize"
                        >
                          {payment.paymentMethod.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusColors[payment.paymentStatus] || "default"
                          }
                          className="capitalize"
                        >
                          {payment.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(
                            new Date(payment.createdAt),
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
                              onClick={() => openDetailDialog(payment)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {payment.paymentStatus === "paid" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openRefundDialog(payment)}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Refund
                                </DropdownMenuItem>
                              </>
                            )}
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
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Order #{selectedPayment?.orderId}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order</p>
                  <p className="font-medium">{selectedPayment.orderId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">
                    {typeof selectedPayment.userId === "object" &&
                    selectedPayment.userId.profile
                      ? `${selectedPayment.userId.profile.firstName} ${selectedPayment.userId.profile.lastName}`
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium text-xl">
                    ${selectedPayment.grandTotal?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Method</p>
                  <p className="font-medium capitalize">
                    {selectedPayment.paymentMethod.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      statusColors[selectedPayment.paymentStatus] || "default"
                    }
                    className="capitalize"
                  >
                    {selectedPayment.paymentStatus}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(
                      new Date(selectedPayment.createdAt),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Order #{selectedPayment?.orderId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="refundAmount">Refund Amount *</Label>
              <Input
                id="refundAmount"
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
                required
                max={selectedPayment?.grandTotal}
              />
              <p className="text-sm text-muted-foreground">
                Max: ${selectedPayment?.grandTotal?.toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refundReason">Reason *</Label>
              <Input
                id="refundReason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Reason for refund"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRefundDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRefund}>Process Refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

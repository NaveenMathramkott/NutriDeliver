"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  MoreVertical,
  DollarSign,
  RotateCcw,
  Eye,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
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
  TableState,
  StatCard,
  DetailDialog,
  DetailGrid,
  DetailItem,
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  TableCell,
  TableHead,
} from "@/components/common";
import { api } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import type { Order, PaymentMethod } from "@/types";
import {
  RefundDialog,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_COLORS,
  type RefundFormValues,
} from "@/features/payments";

const PAGE_SIZE = 10;

const METHOD_COLORS: Record<
  PaymentMethod,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  card: "default",
  cash: "secondary",
  digital_wallet: "success",
};

function customerName(payment: Order): string {
  return typeof payment.userId === "object" && payment.userId.profile
    ? `${payment.userId.profile.firstName} ${payment.userId.profile.lastName}`
    : "Unknown";
}

function customerEmail(payment: Order): string {
  return typeof payment.userId === "object" ? (payment.userId.email ?? "") : "";
}

export function PaymentsPage() {
  const [payments, setPayments] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundValues, setRefundValues] = useState<RefundFormValues>({
    amount: 0,
    reason: "",
  });

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getPayments({
        page: currentPage,
        limit: PAGE_SIZE,
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
  }, [currentPage, statusFilter, methodFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const openDetailDialog = (payment: Order) => {
    setSelectedPayment(payment);
    setIsDetailDialogOpen(true);
  };

  const openRefundDialog = (payment: Order) => {
    setSelectedPayment(payment);
    setRefundValues({ amount: payment.grandTotal, reason: "" });
    setIsRefundDialogOpen(true);
  };

  const handleRefund = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setIsRefunding(true);
    try {
      const response = await api.refundPayment(
        selectedPayment._id,
        refundValues.amount,
        refundValues.reason,
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Refund processed successfully",
          variant: "success",
        });
        setIsRefundDialogOpen(false);
        fetchPayments();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setIsRefunding(false);
    }
  };

  const sumByStatus = (status: string) =>
    payments
      .filter((p) => p.paymentStatus === status)
      .reduce((sum, p) => sum + p.grandTotal, 0);

  const paidCount = payments.filter((p) => p.paymentStatus === "paid").length;
  const successRate =
    payments.length > 0
      ? ((paidCount / payments.length) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Management"
        description="Monitor and manage all payments"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={`$${sumByStatus("paid").toFixed(2)}`}
          icon={<DollarSign className="h-5 w-5" />}
          tone="bg-fresh-100 text-fresh-700 dark:bg-fresh-500/15 dark:text-fresh-400"
          hint="All time"
          hintTone="text-fresh-700 dark:text-fresh-400"
        />
        <StatCard
          label="Pending Payments"
          value={`$${sumByStatus("pending").toFixed(2)}`}
          icon={<AlertCircle className="h-5 w-5" />}
          tone="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
          hint={`${payments.filter((p) => p.paymentStatus === "pending").length} pending`}
          hintTone="text-amber-700 dark:text-amber-400"
        />
        <StatCard
          label="Refunds"
          value={`$${sumByStatus("refunded").toFixed(2)}`}
          icon={<RotateCcw className="h-5 w-5" />}
          tone="bg-destructive/10 text-destructive"
          hint={`${payments.filter((p) => p.paymentStatus === "refunded").length} refunded`}
          hintTone="text-destructive"
        />
        <StatCard
          label="Success Rate"
          value={`${successRate}%`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="bg-primary/10 text-primary"
          hint={`${paidCount} of ${payments.length} paid`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            showSearch={false}
            searchValue=""
            onSearchChange={() => {}}
            onSearch={() => setCurrentPage(1)}
            filters={[
              {
                key: "status",
                label: "All Statuses",
                value: statusFilter,
                onValueChange: setStatusFilter,
                options: PAYMENT_STATUS_OPTIONS,
              },
              {
                key: "method",
                label: "All Methods",
                value: methodFilter,
                onValueChange: setMethodFilter,
                options: PAYMENT_METHOD_OPTIONS,
              },
            ]}
          />

          <DataTable>
            <DataTableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </DataTableHead>
            <DataTableBody>
              <TableState
                isLoading={isLoading}
                isEmpty={payments.length === 0}
                colSpan={7}
                emptyMessage="No payments found"
              />
              {payments.map((payment) => (
                <DataTableRow key={payment._id}>
                  <TableCell>
                    <p className="font-mono text-sm">{payment.orderId}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{customerName(payment)}</p>
                    <p className="text-sm text-muted-foreground">
                      {customerEmail(payment)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      ${payment.grandTotal?.toFixed(2)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={METHOD_COLORS[payment.paymentMethod]}
                      className="capitalize"
                    >
                      {payment.paymentMethod.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        PAYMENT_STATUS_COLORS[payment.paymentStatus] ||
                        "default"
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
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openDetailDialog(payment)}
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {payment.paymentStatus === "paid" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openRefundDialog(payment)}
                            >
                              <RotateCcw className="h-4 w-4" />
                              Refund
                            </DropdownMenuItem>
                          </>
                        )}
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
          <p className="text-sm text-muted-foreground">{total} payments</p>
        </CardContent>
      </Card>

      <DetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        title="Payment Details"
        description={`Order #${selectedPayment?.orderId}`}
        maxWidth="sm:max-w-lg"
      >
        {selectedPayment && (
          <DetailGrid>
            <DetailItem label="Order">{selectedPayment.orderId}</DetailItem>
            <DetailItem label="Customer">
              {customerName(selectedPayment)}
            </DetailItem>
            <DetailItem label="Amount">
              <span className="text-lg">
                ${selectedPayment.grandTotal?.toFixed(2)}
              </span>
            </DetailItem>
            <DetailItem label="Method">
              <Badge
                variant={METHOD_COLORS[selectedPayment.paymentMethod]}
                className="capitalize"
              >
                {selectedPayment.paymentMethod.replace("_", " ")}
              </Badge>
            </DetailItem>
            <DetailItem label="Status">
              <Badge
                variant={
                  PAYMENT_STATUS_COLORS[selectedPayment.paymentStatus] ||
                  "default"
                }
                className="capitalize"
              >
                {selectedPayment.paymentStatus}
              </Badge>
            </DetailItem>
            <DetailItem label="Date">
              {format(
                new Date(selectedPayment.createdAt),
                "MMM dd, yyyy HH:mm",
              )}
            </DetailItem>
          </DetailGrid>
        )}
      </DetailDialog>

      <RefundDialog
        open={isRefundDialogOpen}
        onOpenChange={setIsRefundDialogOpen}
        orderId={selectedPayment?.orderId}
        maxAmount={selectedPayment?.grandTotal ?? 0}
        values={refundValues}
        onValuesChange={setRefundValues}
        onSubmit={handleRefund}
        isSubmitting={isRefunding}
      />
    </div>
  );
}

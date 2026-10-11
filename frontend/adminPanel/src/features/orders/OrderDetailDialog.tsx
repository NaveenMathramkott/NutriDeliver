import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailDialog, DetailGrid, DetailItem } from "@/components/common";
import { SelectField } from "@/components/form";
import type { Order, OrderStatus } from "@/types";
import {
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  formatStatus,
  getNextStatus,
} from "./orderConstants";

export interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  newStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
  onUpdateStatus: () => void;
  isSubmitting?: boolean;
}

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

function riderName(order: Order): string {
  if (typeof order.riderId !== "object" || !order.riderId) {
    return order.riderId ? "Assigned" : "Not assigned";
  }
  return order.riderId.profile
    ? `${order.riderId.profile.firstName} ${order.riderId.profile.lastName}`
    : "Assigned";
}

export function OrderDetailDialog({
  open,
  onOpenChange,
  order,
  newStatus,
  onStatusChange,
  onUpdateStatus,
  isSubmitting,
}: OrderDetailDialogProps) {
  const nextStatus = order ? getNextStatus(order.status) : null;
  const canUpdate = Boolean(order) && newStatus !== order?.status;

  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Order Details"
      description={`Order #${order?.orderId}`}
    >
      {order && (
        <>
          <DetailGrid>
            <DetailItem label="Customer">{customerName(order)}</DetailItem>
            <DetailItem label="Email">{customerEmail(order)}</DetailItem>
            <DetailItem label="Restaurant">{restaurantName(order)}</DetailItem>
            <DetailItem label="Rider">{riderName(order)}</DetailItem>
            <DetailItem label="Payment Method">
              <span className="capitalize">
                {order.paymentMethod.replace(/_/g, " ")}
              </span>
            </DetailItem>
            <DetailItem label="Payment Status">
              <Badge
                variant={PAYMENT_STATUS_COLORS[order.paymentStatus]}
                className="capitalize"
              >
                {formatStatus(order.paymentStatus)}
              </Badge>
            </DetailItem>
            <DetailItem label="Delivery Address" className="sm:col-span-2">
              {order.deliveryAddress.street}, {order.deliveryAddress.city},{" "}
              {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
            </DetailItem>
            <DetailItem label="Status">
              <Badge variant={ORDER_STATUS_COLORS[order.status]}>
                {formatStatus(order.status)}
              </Badge>
            </DetailItem>
          </DetailGrid>

          <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Subtotal
              </p>
              <p className="font-medium">${order.orderTotal?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Delivery Fee
              </p>
              <p className="font-medium">${order.deliveryFee?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Tax
              </p>
              <p className="font-medium">${order.tax?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Grand Total
              </p>
              <p className="text-lg font-bold">
                ${order.grandTotal?.toFixed(2)}
              </p>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">
                Order Items ({order.items.length})
              </h4>
              <ul className="space-y-2">
                {order.items.map((item, index) => (
                  <li
                    key={
                      typeof item.foodItemId === "object"
                        ? item.foodItemId._id
                        : (item.foodItemId ?? `${item.name}-${index}`)
                    }
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                        {item.specialInstructions
                          ? ` · ${item.specialInstructions}`
                          : ""}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {order.appliedOffer && (
            <div className="rounded-lg border border-fresh-200 bg-fresh-50 p-3 text-sm text-fresh-800 dark:border-fresh-500/30 dark:bg-fresh-500/10 dark:text-fresh-200">
              <strong>Offer applied:</strong> {order.appliedOffer.code} — $
              {order.appliedOffer.discountAmount.toFixed(2)} off
            </div>
          )}

          {order.deliveryDetails && (
            <DetailGrid>
              <DetailItem label="Estimated Delivery">
                {order.estimatedDelivery
                  ? format(
                      new Date(order.estimatedDelivery),
                      "MMM dd, yyyy HH:mm",
                    )
                  : "N/A"}
              </DetailItem>
              <DetailItem label="Preparation Time">
                {order.preparationTime} min
              </DetailItem>
              <DetailItem label="Assigned At">
                {order.deliveryDetails.assignedAt
                  ? format(
                      new Date(order.deliveryDetails.assignedAt),
                      "MMM dd, yyyy HH:mm",
                    )
                  : "N/A"}
              </DetailItem>
              <DetailItem label="Picked Up At">
                {order.deliveryDetails.pickedUpAt
                  ? format(
                      new Date(order.deliveryDetails.pickedUpAt),
                      "MMM dd, yyyy HH:mm",
                    )
                  : "N/A"}
              </DetailItem>
              <DetailItem label="Delivered At">
                {order.deliveryDetails.deliveredAt
                  ? format(
                      new Date(order.deliveryDetails.deliveredAt),
                      "MMM dd, yyyy HH:mm",
                    )
                  : "N/A"}
              </DetailItem>
            </DetailGrid>
          )}

          <div className="space-y-3 rounded-lg border p-4">
            <SelectField
              id="order-status"
              label="Update Status"
              options={[
                ...(nextStatus
                  ? [{ value: nextStatus, label: formatStatus(nextStatus) }]
                  : []),
                ...(order.status !== "cancelled"
                  ? [{ value: "cancelled", label: "Cancel Order" }]
                  : []),
              ]}
              value={newStatus}
              onValueChange={(v) => onStatusChange(v as OrderStatus)}
              placeholder="Select status"
            />
            <Button
              className="w-full"
              onClick={onUpdateStatus}
              disabled={!canUpdate || isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </>
      )}
    </DetailDialog>
  );
}

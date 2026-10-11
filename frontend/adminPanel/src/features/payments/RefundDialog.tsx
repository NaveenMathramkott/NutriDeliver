import type { FormEvent } from "react";
import { FormDialog, NumberField, TextareaField } from "@/components/form";
import type { RefundFormValues } from "./paymentConstants";

export interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
  maxAmount: number;
  values: RefundFormValues;
  onValuesChange: (values: RefundFormValues) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
  error?: string;
}

export function RefundDialog({
  open,
  onOpenChange,
  orderId,
  maxAmount,
  values,
  onValuesChange,
  onSubmit,
  isSubmitting,
  error,
}: RefundDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Process Refund"
      description={`Order #${orderId}`}
      submitLabel="Process Refund"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    >
      <NumberField
        id="refund-amount"
        label="Refund Amount"
        required
        min={0}
        max={maxAmount}
        placeholder="0.00"
        value={values.amount}
        onValueChange={(v) => onValuesChange({ ...values, amount: v })}
        error={
          values.amount > maxAmount
            ? `Amount cannot exceed $${maxAmount.toFixed(2)}`
            : error
        }
        description={`Maximum refundable amount: $${maxAmount.toFixed(2)}`}
      />

      <TextareaField
        id="refund-reason"
        label="Reason"
        required
        placeholder="Reason for refund"
        value={values.reason}
        onValueChange={(v) => onValuesChange({ ...values, reason: v })}
        description="Recorded in the order audit log"
      />
    </FormDialog>
  );
}

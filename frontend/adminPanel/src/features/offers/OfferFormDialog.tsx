import type { FormEvent } from "react";
import {
  FormDialog,
  FormRow,
  FormSection,
  SelectField,
  TextField,
  NumberField,
  TextareaField,
  CheckboxField,
} from "@/components/form";
import { DISCOUNT_TYPE_OPTIONS, type OfferFormValues } from "./offerForm";

export interface OfferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  values: OfferFormValues;
  onValuesChange: (values: OfferFormValues) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
}

export function OfferFormDialog({
  open,
  onOpenChange,
  isEditing,
  values,
  onValuesChange,
  onSubmit,
  isSubmitting,
}: OfferFormDialogProps) {
  const set = <K extends keyof OfferFormValues>(
    key: K,
    value: OfferFormValues[K],
  ) => onValuesChange({ ...values, [key]: value });

  const isPercentage = values.discountType === "percentage";

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Offer" : "Create Offer"}
      description={
        isEditing ? "Update offer details" : "Create a new promotional offer"
      }
      submitLabel={isEditing ? "Update" : "Create"}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      maxWidth="sm:max-w-2xl"
    >
      <FormSection title="Offer details">
        <FormRow>
          <TextField
            id="offer-code"
            label="Code"
            required
            placeholder="SAVE20"
            className="font-mono uppercase"
            value={values.code}
            onValueChange={(v) => set("code", v.toUpperCase())}
          />
          <TextField
            id="offer-title"
            label="Title"
            required
            placeholder="Summer Sale"
            value={values.title}
            onValueChange={(v) => set("title", v)}
          />
        </FormRow>

        <TextareaField
          id="offer-description"
          label="Description"
          placeholder="20% off on orders above $30"
          value={values.description}
          onValueChange={(v) => set("description", v)}
        />
      </FormSection>

      <FormSection title="Discount">
        <FormRow>
          <SelectField
            id="offer-discount-type"
            label="Type"
            required
            options={DISCOUNT_TYPE_OPTIONS}
            value={values.discountType}
            onValueChange={(v) =>
              set("discountType", v as OfferFormValues["discountType"])
            }
          />
          <NumberField
            id="offer-discount-value"
            label="Value"
            required
            min="0"
            placeholder={isPercentage ? "20" : "10.00"}
            value={values.discountValue}
            onValueChange={(v) => set("discountValue", v)}
          />
        </FormRow>

        <FormRow>
          <NumberField
            id="offer-min-order"
            label="Min Order Amount"
            required
            min="0"
            placeholder="30.00"
            value={values.minOrderAmount}
            onValueChange={(v) => set("minOrderAmount", v)}
          />
          <NumberField
            id="offer-max-discount"
            label="Max Discount"
            min="0"
            placeholder={isPercentage ? "50.00" : "Not applicable"}
            value={values.maxDiscount}
            onValueChange={(v) => set("maxDiscount", v)}
            disabled={!isPercentage}
            description={
              isPercentage
                ? "Caps the discount on percentage offers"
                : "Only used for percentage offers"
            }
          />
        </FormRow>

        <NumberField
          id="offer-usage-limit"
          label="Usage Limit"
          min="0"
          precision={0}
          placeholder="0"
          value={values.usageLimit}
          onValueChange={(v) => set("usageLimit", v)}
          description="Set to 0 for unlimited redemptions"
        />
      </FormSection>

      <FormSection title="Validity">
        <FormRow>
          <TextField
            id="offer-valid-from"
            label="Valid From"
            required
            type="date"
            value={values.validFrom}
            onValueChange={(v) => set("validFrom", v)}
          />
          <TextField
            id="offer-valid-until"
            label="Valid Until"
            required
            type="date"
            value={values.validUntil}
            onValueChange={(v) => set("validUntil", v)}
          />
        </FormRow>
      </FormSection>

      <CheckboxField
        id="offer-is-active"
        label="Active"
        description="Inactive offers are hidden and cannot be redeemed."
        checked={values.isActive}
        onCheckedChange={(v) => set("isActive", v)}
      />
    </FormDialog>
  );
}

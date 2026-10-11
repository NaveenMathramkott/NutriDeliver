import type { FormEvent } from "react";
import {
  FormDialog,
  TextField,
  TextareaField,
  CheckboxField,
} from "@/components/form";
import type { CategoryFormValues } from "./categoryForm";

export interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  values: CategoryFormValues;
  onValuesChange: (values: CategoryFormValues) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  isEditing,
  values,
  onValuesChange,
  onSubmit,
  isSubmitting,
}: CategoryFormDialogProps) {
  const set = <K extends keyof CategoryFormValues>(
    key: K,
    value: CategoryFormValues[K],
  ) => onValuesChange({ ...values, [key]: value });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Category" : "Create Category"}
      description={
        isEditing ? "Update category details" : "Add a new food category"
      }
      submitLabel={isEditing ? "Update" : "Create"}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    >
      <TextField
        id="category-name"
        label="Name"
        required
        placeholder="e.g. Italian"
        value={values.name}
        onValueChange={(v) => set("name", v)}
      />

      <TextareaField
        id="category-description"
        label="Description"
        placeholder="Short description shown to customers"
        value={values.description}
        onValueChange={(v) => set("description", v)}
      />

      <TextField
        id="category-image"
        label="Image URL"
        type="url"
        placeholder="https://example.com/category.jpg"
        value={values.image}
        onValueChange={(v) => set("image", v)}
      />

      <CheckboxField
        id="category-is-active"
        label="Active"
        description="Inactive categories are hidden from customers."
        checked={values.isActive}
        onCheckedChange={(v) => set("isActive", v)}
      />
    </FormDialog>
  );
}

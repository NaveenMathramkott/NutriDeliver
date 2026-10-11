import type { FormEvent } from "react";
import {
  FormDialog,
  FormRow,
  FormSection,
  SelectField,
  TextField,
} from "@/components/form";
import { ADMIN_ROLE_OPTIONS } from "./adminConstants";
import type { AdminFormValues } from "./adminForm";
import { PermissionsField } from "./PermissionsField";

export interface AdminFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  values: AdminFormValues;
  onValuesChange: (values: AdminFormValues) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
}

export function AdminFormDialog({
  open,
  onOpenChange,
  isEditing,
  values,
  onValuesChange,
  onSubmit,
  isSubmitting,
}: AdminFormDialogProps) {
  const set = <K extends keyof AdminFormValues>(
    key: K,
    value: AdminFormValues[K],
  ) => onValuesChange({ ...values, [key]: value });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Admin" : "Create Admin"}
      description={
        isEditing
          ? "Update administrator account details"
          : "Create a new administrator account"
      }
      submitLabel={isEditing ? "Update" : "Create"}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      maxWidth="sm:max-w-2xl"
    >
      <FormRow>
        <TextField
          id="admin-email"
          label="Email"
          required
          type="email"
          placeholder="admin@example.com"
          value={values.email}
          onValueChange={(v) => set("email", v)}
          disabled={isEditing}
          description={isEditing ? "Email cannot be changed" : undefined}
        />
        <TextField
          id="admin-name"
          label="Full Name"
          required
          placeholder="John Doe"
          value={values.name}
          onValueChange={(v) => set("name", v)}
        />
      </FormRow>

      <FormRow>
        {!isEditing && (
          <TextField
            id="admin-password"
            label="Password"
            required
            type="password"
            placeholder="At least 8 characters"
            value={values.password}
            onValueChange={(v) => set("password", v)}
          />
        )}
        <SelectField
          id="admin-role"
          label="Role"
          required
          options={ADMIN_ROLE_OPTIONS}
          value={values.role}
          onValueChange={(v) => set("role", v)}
        />
      </FormRow>

      <FormSection
        title="Access"
        description="Granular permissions this administrator is granted."
      >
        <PermissionsField
          selected={values.permissions}
          onChange={(permissions) => set("permissions", permissions)}
        />
      </FormSection>
    </FormDialog>
  );
}

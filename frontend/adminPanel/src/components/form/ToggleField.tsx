import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField, type FormFieldProps } from "./FormField";
import { cn } from "@/lib/utils";

export interface SwitchFieldProps extends Omit<FormFieldProps, "children"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** Horizontal toggle row: label + description on the left, switch on the right. */
export function SwitchField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: SwitchFieldProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3",
        className,
      )}
    >
      <div className="space-y-0.5">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export interface CheckboxFieldProps extends Omit<FormFieldProps, "children"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** Inline checkbox with its label to the right, for boolean form values. */
export function CheckboxField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: CheckboxFieldProps) {
  return (
    <FormField
      id={id}
      label={label}
      description={description}
      className={className}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
        />
        <Label htmlFor={id} className="cursor-pointer font-normal">
          {label}
        </Label>
      </div>
    </FormField>
  );
}

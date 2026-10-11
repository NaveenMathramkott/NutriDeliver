import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField, type FormFieldProps } from "./FormField";
import { fieldProps, useFieldControl } from "./fieldControl";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps extends Omit<FormFieldProps, "children"> {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function SelectField({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  className,
  ...field
}: SelectFieldProps) {
  const control = useFieldControl();
  const describedBy = control?.errorId ?? control?.descriptionId;
  return (
    <FormField {...field}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          id={control?.id}
          aria-describedby={describedBy}
          aria-invalid={control?.invalid || undefined}
          className={cn("w-full", className)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

export interface TextareaFieldProps extends Omit<FormFieldProps, "children"> {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function TextareaField({
  value,
  onValueChange,
  placeholder,
  rows = 3,
  className,
  ...field
}: TextareaFieldProps) {
  const control = useFieldControl();
  return (
    <FormField {...field}>
      <Textarea
        {...fieldProps(control)}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn("w-full resize-y", className)}
      />
    </FormField>
  );
}

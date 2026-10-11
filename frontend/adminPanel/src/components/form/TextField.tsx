import * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { FormField, type FormFieldProps } from "./FormField";
import { fieldProps, useFieldControl } from "./fieldControl";
import { cn } from "@/lib/utils";

type TextFieldProps = Omit<FormFieldProps, "children"> & {
  value: string;
  onValueChange: (value: string) => void;
} & Omit<InputProps, "id" | "value" | "onChange">;

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ value, onValueChange, className, ...field }, ref) => {
    const control = useFieldControl();
    return (
      <FormField {...field}>
        <Input
          {...fieldProps(control)}
          ref={ref}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className={cn("w-full", className)}
        />
      </FormField>
    );
  },
);
TextField.displayName = "TextField";

type NumberFieldProps = Omit<
  TextFieldProps,
  "value" | "onValueChange" | "type"
> & {
  value: number;
  onValueChange: (value: number) => void;
  /** Number of decimals to keep. Defaults to 2 (money-friendly). */
  precision?: number;
};

export const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ value, onValueChange, precision = 2, className, ...field }, ref) => {
    const control = useFieldControl();
    const handleChange = (raw: string) => {
      if (raw === "") {
        onValueChange(0);
        return;
      }
      const parsed = Number(raw);
      if (Number.isNaN(parsed)) return;
      const factor = 10 ** precision;
      onValueChange(Math.round(parsed * factor) / factor);
    };
    return (
      <FormField {...field}>
        <Input
          {...fieldProps(control)}
          ref={ref}
          type="number"
          inputMode="decimal"
          step="any"
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => handleChange(e.target.value)}
          className={cn("w-full", className)}
        />
      </FormField>
    );
  },
);
NumberField.displayName = "NumberField";

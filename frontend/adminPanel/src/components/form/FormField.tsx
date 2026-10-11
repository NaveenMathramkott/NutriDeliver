import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FieldControlContext, getFieldTextIds } from "./fieldControl";

export interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  className?: string;
  /** Renders the label as screen-reader only, for inline filter controls. */
  hideLabel?: boolean;
  children: React.ReactNode;
}

/**
 * Consistent label / control / helper-text layout for every form control.
 * Controls receive `id`, `aria-describedby` and `aria-invalid` from context so
 * individual field components stay free of boilerplate.
 */
export function FormField({
  id,
  label,
  required,
  description,
  error,
  className,
  hideLabel,
  children,
}: FormFieldProps) {
  const { descriptionId, errorId } = getFieldTextIds(
    id,
    Boolean(description),
    Boolean(error),
  );

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className={cn(hideLabel && "sr-only")}>
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      <FieldControlContext.Provider
        value={{ id, descriptionId, errorId, invalid: Boolean(error) }}
      >
        {children}
      </FieldControlContext.Provider>
      {description && !error && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

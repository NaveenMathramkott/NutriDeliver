import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of equal-width columns. Stacks to a single column on mobile. */
  cols?: 1 | 2 | 3 | 4;
}

const colsClass: Record<NonNullable<FormRowProps["cols"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

/** Responsive grid that keeps fields aligned in consistent columns. */
export function FormRow({ cols = 2, className, ...props }: FormRowProps) {
  return (
    <div
      className={cn("grid gap-4 gap-x-5 gap-y-5", colsClass[cols], className)}
      {...props}
    />
  );
}

export interface FormSectionProps {
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

/** Titled group of fields inside a form. */
export function FormSection({
  title,
  description,
  className,
  children,
}: FormSectionProps) {
  return (
    <fieldset className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1 border-l-2 border-primary/60 pl-3">
          {title && (
            <legend className="text-sm font-semibold tracking-tight">
              {title}
            </legend>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </fieldset>
  );
}

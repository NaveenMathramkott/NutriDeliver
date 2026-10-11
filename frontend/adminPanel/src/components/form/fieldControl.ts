import * as React from "react";

export interface FieldControlA11y {
  id: string;
  descriptionId?: string;
  errorId?: string;
  invalid: boolean;
}

export const FieldControlContext = React.createContext<FieldControlA11y | null>(
  null,
);

/** Reads the a11y props published by the enclosing FormField. */
export function useFieldControl(): FieldControlA11y | null {
  return React.useContext(FieldControlContext);
}

/** Spreads `id`, `aria-describedby` and `aria-invalid` onto a control. */
export function fieldProps(control: FieldControlA11y | null) {
  if (!control) return {};
  return {
    id: control.id,
    "aria-describedby": control.errorId ?? control.descriptionId,
    "aria-invalid": control.invalid || undefined,
  };
}

/** Builds the ids used to wire a control to its helper and error text. */
export function getFieldTextIds(
  id: string,
  hasDescription: boolean,
  hasError: boolean,
) {
  return {
    descriptionId: hasDescription ? `${id}-description` : undefined,
    errorId: hasError ? `${id}-error` : undefined,
  };
}

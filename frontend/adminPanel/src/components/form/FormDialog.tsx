import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  maxWidth?: string;
  /** Rendered between the submit and cancel buttons, e.g. a destructive action. */
  secondaryAction?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Dialog that wires its footer buttons to an inner <form> via the HTML `form`
 * attribute, so the submit button works without DOM queries. The body is
 * scrollable and the footer stays pinned.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isSubmitting = false,
  maxWidth = "sm:max-w-lg",
  secondaryAction,
  className,
  children,
}: FormDialogProps) {
  const formId = React.useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col gap-0 p-0",
          maxWidth,
          className,
        )}
      >
        <DialogHeader className="space-y-1.5 px-6 pt-6 text-left">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form
          id={formId}
          onSubmit={onSubmit}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5"
        >
          {children}
        </form>

        <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-4">
          {secondaryAction}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

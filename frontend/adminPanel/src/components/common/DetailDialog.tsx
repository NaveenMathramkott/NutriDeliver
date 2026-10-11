import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  maxWidth?: string;
  children: React.ReactNode;
}

/** Read-only detail dialog with a consistent header, scrollable body and footer. */
export function DetailDialog({
  open,
  onOpenChange,
  title,
  description,
  maxWidth = "sm:max-w-2xl",
  children,
}: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`flex max-h-[90vh] flex-col gap-0 p-0 ${maxWidth}`}
      >
        <DialogHeader className="space-y-1.5 px-6 pt-6 text-left">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {children}
        </div>
        <DialogFooter className="border-t bg-muted/30 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface DetailGridProps {
  cols?: 2 | 3;
  children: React.ReactNode;
  className?: string;
}

/** Aligned label/value grid used inside detail dialogs. */
export function DetailGrid({ cols = 2, children, className }: DetailGridProps) {
  return (
    <div
      className={`grid gap-5 ${
        cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function DetailItem({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

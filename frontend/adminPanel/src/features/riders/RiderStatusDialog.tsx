import type { FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/form";
import {
  AVAILABILITY_SELECT_OPTIONS,
  type RiderAvailability,
} from "./riderConstants";

export interface RiderStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riderName?: string;
  status: RiderAvailability;
  onStatusChange: (status: RiderAvailability) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
}

export function RiderStatusDialog({
  open,
  onOpenChange,
  riderName,
  status,
  onStatusChange,
  onSubmit,
  isSubmitting,
}: RiderStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Rider Status</DialogTitle>
          <DialogDescription>
            Change the availability status for {riderName}.
          </DialogDescription>
        </DialogHeader>

        <form id="rider-status-form" onSubmit={onSubmit} className="py-2">
          <SelectField
            id="rider-availability"
            label="Availability"
            required
            options={AVAILABILITY_SELECT_OPTIONS}
            value={status}
            onValueChange={(v) => onStatusChange(v as RiderAvailability)}
            description="Controls whether the rider can receive new deliveries."
          />
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="rider-status-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

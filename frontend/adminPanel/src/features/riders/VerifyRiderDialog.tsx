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

export interface VerifyRiderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riderName?: string;
  isVerified: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
}

export function VerifyRiderDialog({
  open,
  onOpenChange,
  riderName,
  isVerified,
  onSubmit,
  isSubmitting,
}: VerifyRiderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isVerified ? "Unverify" : "Verify"} Rider</DialogTitle>
          <DialogDescription>
            {isVerified
              ? `Revoke verification for ${riderName}? They will not be able to accept deliveries.`
              : `Verify ${riderName}? They will be able to accept deliveries.`}
          </DialogDescription>
        </DialogHeader>

        <form id="rider-verify-form" onSubmit={onSubmit} />

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
            form="rider-verify-form"
            variant={isVerified ? "destructive" : "default"}
            disabled={isSubmitting}
          >
            {isVerified ? "Unverify" : "Verify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

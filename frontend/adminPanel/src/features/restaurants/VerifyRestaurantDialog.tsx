import { Store } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface VerifyRestaurantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantName?: string;
  isVerified: boolean;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

/** Confirmation dialog for verifying / un-verifying a restaurant. */
export function VerifyRestaurantDialog({
  open,
  onOpenChange,
  restaurantName,
  isVerified,
  onSubmit,
  isSubmitting,
}: VerifyRestaurantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isVerified ? "Remove Verification" : "Verify Restaurant"}
          </DialogTitle>
          <DialogDescription>
            {isVerified
              ? `${restaurantName} will no longer be able to operate on the platform.`
              : `${restaurantName} will be able to accept orders once verified.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <p className="font-medium">{restaurantName}</p>
          <Badge
            variant={isVerified ? "success" : "warning"}
            className="ml-auto"
          >
            {isVerified ? "Verified" : "Pending"}
          </Badge>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            variant={isVerified ? "destructive" : "default"}
            disabled={isSubmitting}
          >
            {isVerified ? "Remove Verification" : "Verify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

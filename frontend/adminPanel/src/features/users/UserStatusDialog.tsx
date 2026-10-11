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
import { SwitchField } from "@/components/form";
import type { User } from "@/types";

export interface UserStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  isActive: boolean;
  onIsActiveChange: (isActive: boolean) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
}

export function UserStatusDialog({
  open,
  onOpenChange,
  user,
  isActive,
  onIsActiveChange,
  onSubmit,
  isSubmitting,
}: UserStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change User Status</DialogTitle>
          <DialogDescription>
            {user?.profile.firstName} {user?.profile.lastName} will be{" "}
            {isActive ? "activated" : "deactivated"} immediately.
          </DialogDescription>
        </DialogHeader>

        <form id="user-status-form" onSubmit={onSubmit}>
          <SwitchField
            id="user-is-active"
            label="Account Active"
            description="Inactive users cannot sign in or place orders."
            checked={isActive}
            onCheckedChange={onIsActiveChange}
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
            form="user-status-form"
            variant={isActive ? "default" : "destructive"}
            disabled={isSubmitting}
          >
            {isActive ? "Activate" : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

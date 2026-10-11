import { format } from "date-fns";
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
import { availabilityBadge } from "./riderConstants";
import type { RiderProfile } from "@/types";
import type { User } from "@/types";

type RiderWithProfile = User & { riderProfile: RiderProfile };

export interface RiderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rider: RiderWithProfile | null;
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

export function RiderDetailDialog({
  open,
  onOpenChange,
  rider,
}: RiderDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {rider?.profile.firstName} {rider?.profile.lastName}
          </DialogTitle>
          <DialogDescription>Rider details</DialogDescription>
        </DialogHeader>

        {rider && (
          <div className="grid gap-5 py-2 sm:grid-cols-3">
            <DetailItem label="Email">{rider.email}</DetailItem>
            <DetailItem label="Phone">
              {rider.profile.phone || "N/A"}
            </DetailItem>
            <DetailItem label="Verified">
              <Badge variant={rider.isVerified ? "success" : "warning"}>
                {rider.isVerified ? "Verified" : "Pending"}
              </Badge>
            </DetailItem>

            <DetailItem label="Vehicle">
              <span className="capitalize">
                {rider.riderProfile?.vehicleType || "N/A"}
              </span>{" "}
              <span className="text-muted-foreground">
                {rider.riderProfile?.vehicleNumber || ""}
              </span>
            </DetailItem>
            <DetailItem label="License">
              {rider.riderProfile?.licenseNumber || "N/A"}
            </DetailItem>
            <DetailItem label="Status">
              <Badge
                variant={availabilityBadge(
                  rider.riderProfile?.availabilityStatus?.status,
                )}
                className="capitalize"
              >
                {rider.riderProfile?.availabilityStatus?.status || "offline"}
              </Badge>
            </DetailItem>

            <DetailItem label="Total Deliveries">
              {rider.riderProfile?.earnings?.totalDeliveries || 0}
            </DetailItem>
            <DetailItem label="Total Earnings">
              $
              {rider.riderProfile?.earnings?.totalEarnings?.toFixed(2) ||
                "0.00"}
            </DetailItem>
            <DetailItem label="Pending Payout">
              $
              {rider.riderProfile?.earnings?.pendingPayout?.toFixed(2) ||
                "0.00"}
            </DetailItem>

            <div className="space-y-2 sm:col-span-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Documents
              </p>
              {rider.riderProfile?.documents?.length ? (
                <ul className="space-y-1">
                  {rider.riderProfile.documents.map((doc) => (
                    <li
                      key={doc.type}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <Badge variant="secondary" className="capitalize">
                        {doc.type}
                      </Badge>
                      <span className="text-muted-foreground">
                        {format(new Date(doc.uploadedAt), "MMM dd, yyyy")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No documents uploaded
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

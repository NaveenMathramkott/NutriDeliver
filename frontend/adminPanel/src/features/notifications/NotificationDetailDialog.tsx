import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DetailDialog, DetailGrid, DetailItem } from "@/components/common";
import { NOTIFICATION_TYPE_COLORS } from "./notificationConstants";
import type { Notification } from "@/types";

export interface NotificationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: Notification | null;
}

export function NotificationDetailDialog({
  open,
  onOpenChange,
  notification,
}: NotificationDetailDialogProps) {
  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      title={notification?.title ?? "Notification"}
      description="Notification details"
      maxWidth="sm:max-w-lg"
    >
      {notification && (
        <>
          <DetailGrid>
            <DetailItem label="Type">
              <Badge
                variant={NOTIFICATION_TYPE_COLORS[notification.type]}
                className="capitalize"
              >
                {notification.type}
              </Badge>
            </DetailItem>
            <DetailItem label="Status">
              <Badge variant={notification.isRead ? "secondary" : "success"}>
                {notification.isRead ? "Read" : "Unread"}
              </Badge>
            </DetailItem>
            <DetailItem label="Recipient">
              User #{notification.userId?.slice(0, 8)}
            </DetailItem>
            <DetailItem label="Date">
              {format(new Date(notification.createdAt), "MMM dd, yyyy HH:mm")}
            </DetailItem>
          </DetailGrid>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Message
            </p>
            <p className="text-sm">{notification.message}</p>
          </div>

          {notification.relatedData && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Related Data
              </p>
              <pre className="max-h-56 overflow-auto rounded-md bg-muted p-3 text-xs">
                {JSON.stringify(notification.relatedData, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </DetailDialog>
  );
}

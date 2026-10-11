import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/services/api";
import { NOTIFICATION_TYPE_COLORS } from "@/features/notifications";
import type { Notification } from "@/types";

const LIMIT = 5;

/** Notification bell with live unread count and a recent-activity dropdown. */
export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [list, unread] = await Promise.all([
        api.getNotifications({ page: 1, limit: LIMIT }),
        fetchUnreadCount(),
      ]);
      if (list.success && list.data) {
        setNotifications(
          (list.data as { notifications?: Notification[] }).notifications ?? [],
        );
      }
      setUnreadCount(unread);
    } catch {
      // Leave the bell empty rather than surfacing an error in the header.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkAllRead = async () => {
    await api.markAllAsRead();
    load();
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && load()}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-2">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2 px-2 pb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            You're all caught up
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className="items-start gap-3 px-2 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {!notification.isRead && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                    <span className="truncate">{notification.title}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <Badge
                  variant={NOTIFICATION_TYPE_COLORS[notification.type]}
                  className="mt-0.5 shrink-0 text-[10px] capitalize"
                >
                  {notification.type}
                </Badge>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <div className="border-t pt-1">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link to="/notifications">View all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

async function fetchUnreadCount(): Promise<number> {
  const response = await api.getUnreadNotificationCount();
  if (!response.success || !response.data) return 0;
  return response.data.unreadCount ?? 0;
}

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MoreVertical, CheckCircle2, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  PageHeader,
  FilterBar,
  ConfirmDialog,
  TablePagination,
  TableFooterText,
  TableState,
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  TableCell,
  TableHead,
} from "@/components/common";
import { api } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import type { Notification } from "@/types";
import {
  NotificationDetailDialog,
  NOTIFICATION_TYPE_OPTIONS,
  NOTIFICATION_READ_OPTIONS,
  NOTIFICATION_TYPE_COLORS,
} from "@/features/notifications";

const PAGE_SIZE = 10;

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getNotifications({
        page: currentPage,
        limit: PAGE_SIZE,
        type: typeFilter,
        isRead:
          readFilter === "true"
            ? true
            : readFilter === "false"
              ? false
              : undefined,
      });
      if (response.success && response.data) {
        const data = response.data as {
          notifications: Notification[];
          pagination: { current: number; pages: number; total: number };
        };
        setNotifications(data.notifications);
        setTotalPages(data.pagination.pages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, typeFilter, readFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const openDetailDialog = async (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailDialogOpen(true);
    if (!notification.isRead) {
      await api.markAsRead(notification._id);
      fetchNotifications();
    }
  };

  const markAsRead = async (notification: Notification) => {
    await api.markAsRead(notification._id);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllAsRead();
      toast({
        title: "Success",
        description: "All notifications marked as read",
        variant: "success",
      });
      fetchNotifications();
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedNotification) return;
    try {
      const response = await api.deleteNotification(selectedNotification._id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Notification deleted",
          variant: "success",
        });
        setIsDeleteDialogOpen(false);
        fetchNotifications();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const visibleNotifications = searchQuery
    ? notifications.filter((n) =>
        `${n.title} ${n.message}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )
    : notifications;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Manage system notifications"
        action={
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle2 className="h-4 w-4" />
            Mark All Read
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search notifications..."
            filters={[
              {
                key: "type",
                label: "All Types",
                value: typeFilter,
                onValueChange: setTypeFilter,
                options: NOTIFICATION_TYPE_OPTIONS,
              },
              {
                key: "read",
                label: "All",
                value: readFilter,
                onValueChange: setReadFilter,
                options: NOTIFICATION_READ_OPTIONS,
              },
            ]}
          />

          <DataTable>
            <DataTableHead>
              <TableHead>Notification</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </DataTableHead>
            <DataTableBody>
              <TableState
                isLoading={isLoading}
                isEmpty={visibleNotifications.length === 0}
                colSpan={6}
                emptyMessage="No notifications found"
              />
              {visibleNotifications.map((notification) => (
                <DataTableRow
                  key={notification._id}
                  className={cn(!notification.isRead && "bg-muted/30")}
                >
                  <TableCell>
                    <p
                      className={cn(
                        "font-medium",
                        !notification.isRead && "font-bold",
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="max-w-[300px] truncate text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={NOTIFICATION_TYPE_COLORS[notification.type]}
                      className="capitalize"
                    >
                      {notification.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      User #{notification.userId?.slice(0, 8)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={notification.isRead ? "secondary" : "success"}
                    >
                      {notification.isRead ? "Read" : "Unread"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(
                        new Date(notification.createdAt),
                        "MMM dd, yyyy HH:mm",
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openDetailDialog(notification)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        {!notification.isRead && (
                          <DropdownMenuItem
                            onClick={() => markAsRead(notification)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark as Read
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedNotification(notification);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="text-destructive">Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          <TableFooterText
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            total={total}
            itemLabel="notifications"
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Notification"
        description="Are you sure you want to delete this notification? This action cannot be undone."
        onConfirm={handleDelete}
      />

      <NotificationDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        notification={selectedNotification}
      />
    </div>
  );
}

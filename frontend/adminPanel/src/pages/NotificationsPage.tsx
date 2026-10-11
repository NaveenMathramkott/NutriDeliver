"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  MoreVertical,
  Bell,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

const typeColors: Record<
  Notification["type"],
  "default" | "success" | "warning" | "destructive" | "secondary" | "info"
> = {
  order: "info",
  payment: "success",
  promotion: "warning",
  system: "default",
  delivery: "info",
};

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

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api.getNotifications({
        page: currentPage,
        limit: 10,
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
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, searchQuery, typeFilter, readFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchNotifications();
  };

  const openDetailDialog = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailDialogOpen(true);
    if (!notification.isRead) {
      api.markAsRead(notification._id);
      fetchNotifications();
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
        fetchNotifications();
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Manage system notifications</p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
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
          }}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark All Read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-4 flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Read Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="true">Read</SelectItem>
                <SelectItem value="false">Unread</SelectItem>
              </SelectContent>
            </Select>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Notification</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : notifications.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No notifications found
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((notification) => (
                    <TableRow
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
                        <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {notification.message}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={typeColors[notification.type] || "default"}
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
                          variant={
                            notification.isRead ? "secondary" : "success"
                          }
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openDetailDialog(notification)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            {!notification.isRead && (
                              <DropdownMenuItem
                                onClick={() => {
                                  api.markAsRead(notification._id);
                                  fetchNotifications();
                                }}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
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
                              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                              <span className="text-destructive">Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={currentPage === pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
            <DialogDescription>Notification Details</DialogDescription>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <Badge
                    variant={typeColors[selectedNotification.type] || "default"}
                    className="capitalize"
                  >
                    {selectedNotification.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      selectedNotification.isRead ? "secondary" : "success"
                    }
                  >
                    {selectedNotification.isRead ? "Read" : "Unread"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">User ID</p>
                  <p className="font-medium">{selectedNotification.userId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(
                      new Date(selectedNotification.createdAt),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-muted-foreground">Message</p>
                <p>{selectedNotification.message}</p>
              </div>
              {selectedNotification.relatedData && (
                <div className="border-t pt-4">
                  <p className="text-muted-foreground">Related Data</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(selectedNotification.relatedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

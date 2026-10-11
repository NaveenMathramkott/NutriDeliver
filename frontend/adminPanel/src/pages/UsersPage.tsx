"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  MoreVertical,
  Trash2,
  UserCheck,
  UserX,
  Phone,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { User } from "@/types";
import {
  UserStatusDialog,
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
  ROLE_COLORS,
} from "@/features/users";

const PAGE_SIZE = 10;

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getUsers({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchQuery,
        role: roleFilter,
        status:
          statusFilter === ""
            ? undefined
            : statusFilter === "true"
              ? "active"
              : "inactive",
      });
      if (response.success && response.data) {
        const data = response.data as {
          users: User[];
          pagination: { current: number; pages: number; total: number };
        };
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (user: User, isActive: boolean) => {
    setIsStatusSubmitting(true);
    try {
      const response = await api.updateUserStatus(
        user._id,
        isActive ? "active" : "inactive",
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `User ${isActive ? "activated" : "deactivated"}`,
          variant: "success",
        });
        setIsStatusDialogOpen(false);
        fetchUsers();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      const response = await api.deleteUser(selectedUser._id);
      if (response.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
          variant: "success",
        });
        setIsDeleteDialogOpen(false);
        fetchUsers();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const openStatusDialog = (user: User) => {
    setSelectedUser(user);
    setNewStatus(!user.isActive);
    setIsStatusDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage platform users and their accounts"
      />

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search users..."
            onSearch={() => setCurrentPage(1)}
            filters={[
              {
                key: "role",
                label: "All Roles",
                value: roleFilter,
                onValueChange: setRoleFilter,
                options: USER_ROLE_OPTIONS,
              },
              {
                key: "status",
                label: "All Statuses",
                value: statusFilter,
                onValueChange: setStatusFilter,
                options: USER_STATUS_OPTIONS,
              },
            ]}
          />

          <DataTable>
            <DataTableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </DataTableHead>
            <DataTableBody>
              <TableState
                isLoading={isLoading}
                isEmpty={users.length === 0}
                colSpan={7}
                emptyMessage="No users found"
              />
              {users.map((user) => (
                <DataTableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.profile.avatar}
                          alt={user.profile.firstName}
                        />
                        <AvatarFallback>
                          {user.profile.firstName?.charAt(0).toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.profile.firstName} {user.profile.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={ROLE_COLORS[user.role] || "default"}
                      className="capitalize"
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isActive ? "success" : "secondary"}
                      className="capitalize"
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isVerified ? "success" : "warning"}>
                      {user.isVerified ? "Verified" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {user.profile.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{user.profile.phone}</span>
                        </div>
                      )}
                      {user.addresses && user.addresses.length > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="max-w-[150px] truncate">
                            {user.addresses[0].street}, {user.addresses[0].city}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), "MMM dd, yyyy")}
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
                          onClick={() => openStatusDialog(user)}
                        >
                          {user.isActive ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                          {user.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
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
            itemLabel="users"
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete ${selectedUser?.profile.firstName} ${selectedUser?.profile.lastName}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />

      <UserStatusDialog
        open={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
        user={selectedUser}
        isActive={newStatus}
        onIsActiveChange={setNewStatus}
        isSubmitting={isStatusSubmitting}
        onSubmit={(e) => {
          e.preventDefault();
          if (selectedUser) handleStatusChange(selectedUser, newStatus);
        }}
      />
    </div>
  );
}

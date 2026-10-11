"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  AdminFormDialog,
  emptyAdminForm,
  type AdminFormValues,
} from "@/features/admins";
import { ROLE_COLORS } from "@/features/admins/adminConstants";

const PAGE_SIZE = 10;

export function AdminsPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<AdminFormValues>(emptyAdminForm);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getAdmins({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchQuery,
        role: roleFilter,
      });
      if (response.success && response.data) {
        const data = response.data as {
          users: User[];
          pagination: { current: number; pages: number; total: number };
        };
        setAdmins(data.users.filter((u) => u.role === "admin"));
        setTotalPages(data.pagination.pages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
      toast({
        title: "Error",
        description: "Failed to fetch admins",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, roleFilter]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const openCreateDialog = () => {
    setIsEditing(false);
    setSelectedAdmin(null);
    setFormValues(emptyAdminForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (admin: User) => {
    setIsEditing(true);
    setSelectedAdmin(admin);
    setFormValues({
      email: admin.email,
      name: `${admin.profile.firstName} ${admin.profile.lastName}`,
      password: "",
      role: admin.role,
      permissions: admin.permissions || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response =
        isEditing && selectedAdmin
          ? await api.updateAdmin(selectedAdmin._id, {
              name: formValues.name,
              role: formValues.role,
              permissions: formValues.permissions,
            })
          : await api.createAdmin({
              email: formValues.email,
              name: formValues.name,
              password: formValues.password,
              role: formValues.role,
              permissions: formValues.permissions,
            });

      if (response.success) {
        toast({
          title: "Success",
          description: isEditing ? "Admin updated" : "Admin created",
          variant: "success",
        });
        setIsDialogOpen(false);
        fetchAdmins();
      }
    } catch {
      toast({
        title: "Error",
        description: isEditing
          ? "Failed to update admin"
          : "Failed to create admin",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;
    try {
      const response = await api.deleteAdmin(selectedAdmin._id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Admin deleted",
          variant: "success",
        });
        setIsDeleteDialogOpen(false);
        fetchAdmins();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete admin",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Management"
        description="Manage administrator accounts"
        action={<Button onClick={openCreateDialog}>Add Admin</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Administrators</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search admins..."
            onSearch={() => setCurrentPage(1)}
            filters={[
              {
                key: "role",
                label: "All Roles",
                value: roleFilter,
                onValueChange: setRoleFilter,
                options: [
                  { value: "", label: "All Roles" },
                  { value: "admin", label: "Admin" },
                ],
              },
            ]}
          />

          <DataTable>
            <DataTableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </DataTableHead>
            <DataTableBody>
              <TableState
                isLoading={isLoading}
                isEmpty={admins.length === 0}
                colSpan={7}
                emptyMessage="No admins found"
              />
              {admins.map((admin) => (
                <DataTableRow key={admin._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={admin.profile.avatar}
                          alt={admin.profile.firstName}
                        />
                        <AvatarFallback>
                          {admin.profile.firstName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {admin.profile.firstName} {admin.profile.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {admin.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={ROLE_COLORS[admin.role] || "default"}
                      className="capitalize"
                    >
                      {admin.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {admin.permissions?.slice(0, 3).map((p: string) => (
                        <Badge key={p} variant="secondary" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                      {admin.permissions && admin.permissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{admin.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.isActive ? "success" : "secondary"}>
                      {admin.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {admin.profile.lastLoginAt
                        ? format(
                            new Date(admin.profile.lastLoginAt),
                            "MMM dd, yyyy",
                          )
                        : "Never"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(admin.createdAt), "MMM dd, yyyy")}
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
                        <DropdownMenuItem onClick={() => openEditDialog(admin)}>
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAdmin(admin);
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
          <p className="text-sm text-muted-foreground">{total} admins</p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Admin"
        description={`Are you sure you want to delete ${selectedAdmin?.profile.firstName} ${selectedAdmin?.profile.lastName}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />

      <AdminFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isEditing={isEditing}
        values={formValues}
        onValuesChange={setFormValues}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

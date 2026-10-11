"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MoreVertical, Tag, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { Category } from "@/types";
import {
  CategoryFormDialog,
  emptyCategoryForm,
  type CategoryFormValues,
} from "@/features/categories";

const PAGE_SIZE = 10;

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] =
    useState<CategoryFormValues>(emptyCategoryForm);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getCategories({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchQuery || undefined,
        isActive: statusFilter === "" ? undefined : statusFilter === "true",
      });
      if (response.success && response.data) {
        const { categories, pagination } = response.data;
        setCategories(categories);
        setTotalPages(pagination.pages);
        setTotal(pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreateDialog = () => {
    setIsEditing(false);
    setSelectedCategory(null);
    setFormValues(emptyCategoryForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setIsEditing(true);
    setSelectedCategory(category);
    setFormValues({
      name: category.name,
      description: category.description,
      image: category.image,
      isActive: category.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response =
        isEditing && selectedCategory
          ? await api.updateCategory(selectedCategory._id, formValues)
          : await api.createCategory(formValues);

      if (response.success) {
        toast({
          title: "Success",
          description: isEditing ? "Category updated" : "Category created",
          variant: "success",
        });
        setIsDialogOpen(false);
        fetchCategories();
      }
    } catch {
      toast({
        title: "Error",
        description: isEditing
          ? "Failed to update category"
          : "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    try {
      const response = await api.deleteCategory(selectedCategory._id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Category deleted",
          variant: "success",
        });
        setIsDeleteDialogOpen(false);
        fetchCategories();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category Management"
        description="Manage food categories"
        action={<Button onClick={openCreateDialog}>Add Category</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search categories..."
            onSearch={() => setCurrentPage(1)}
            filters={[
              {
                key: "status",
                label: "All Statuses",
                value: statusFilter,
                onValueChange: setStatusFilter,
                options: [
                  { value: "", label: "All Statuses" },
                  { value: "true", label: "Active" },
                  { value: "false", label: "Inactive" },
                ],
              },
            ]}
          />

          <DataTable>
            <DataTableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Image</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </DataTableHead>
            <DataTableBody>
              <TableState
                isLoading={isLoading}
                isEmpty={categories.length === 0}
                colSpan={5}
                emptyMessage="No categories found"
              />
              {categories.map((category) => (
                <DataTableRow key={category._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Tag className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Added{" "}
                          {format(new Date(category.createdAt), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {category.description || "No description"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={category.isActive ? "success" : "secondary"}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground">No image</span>
                    )}
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
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCategory(category);
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
            itemLabel="categories"
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Category"
        description={`Are you sure you want to delete ${selectedCategory?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />

      <CategoryFormDialog
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

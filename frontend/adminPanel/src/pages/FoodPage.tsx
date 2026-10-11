"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  MoreVertical,
  CheckCircle2,
  XCircle,
  Utensils,
  Tag,
  DollarSign,
  Clock,
  Flame,
} from "lucide-react";
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
import type { Category, FoodItem } from "@/types";
import { AVAILABILITY_OPTIONS, categoryOptions } from "@/features/food";

const PAGE_SIZE = 10;

export function FoodPage() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchFoods = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getFoods({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchQuery,
        category: categoryFilter,
        isAvailable:
          availabilityFilter === "true"
            ? true
            : availabilityFilter === "false"
              ? false
              : undefined,
      });
      if (response.success && response.data) {
        const data = response.data as {
          foodItems: FoodItem[];
          pagination: { current: number; pages: number; total: number };
        };
        setFoods(data.foodItems);
        setTotalPages(data.pagination.pages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch foods:", error);
      toast({
        title: "Error",
        description: "Failed to fetch food items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, categoryFilter, availabilityFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.getCategories({ limit: 100 });
      if (response.success && response.data) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAvailabilityChange = async (food: FoodItem) => {
    try {
      const response = await api.toggleFoodAvailability(food._id);
      if (response.success) {
        toast({
          title: "Success",
          description: `${food.name} is now ${
            food.isAvailable ? "unavailable" : "available"
          }`,
          variant: "success",
        });
        fetchFoods();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to toggle availability",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedFood) return;
    try {
      const response = await api.deleteFood(selectedFood._id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Food item deleted",
          variant: "success",
        });
        setIsDeleteDialogOpen(false);
        fetchFoods();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete food item",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Food Management"
        description="Manage food items across all restaurants"
      />

      <Card>
        <CardHeader>
          <CardTitle>Food Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search food items..."
            onSearch={() => setCurrentPage(1)}
            filters={[
              {
                key: "category",
                label: "All Categories",
                value: categoryFilter,
                onValueChange: setCategoryFilter,
                options: categoryOptions(categories),
              },
              {
                key: "availability",
                label: "Availability",
                value: availabilityFilter,
                onValueChange: setAvailabilityFilter,
                options: AVAILABILITY_OPTIONS,
              },
            ]}
          />

          <DataTable>
            <DataTableHead>
              <TableHead>Food Item</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Nutrition</TableHead>
              <TableHead>Dietary Tags</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Prep Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </DataTableHead>
            <DataTableBody>
              <TableState
                isLoading={isLoading}
                isEmpty={foods.length === 0}
                colSpan={9}
                emptyMessage="No food items found"
              />
              {foods.map((food) => (
                <DataTableRow key={food._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={food.images?.[0]} alt={food.name} />
                        <AvatarFallback>
                          <Utensils className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{food.name}</p>
                        <p className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {food.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {typeof food.restaurantId === "object"
                        ? food.restaurantId.name
                        : "N/A"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      <Tag className="h-3 w-3" />
                      {typeof food.categoryId === "object"
                        ? food.categoryId.name
                        : "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span>${food.price.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        <Flame className="mr-1 inline h-3 w-3" />
                        {food.calories} cal
                      </span>
                      <span>P: {food.protein}g</span>
                      <span>C: {food.carbs}g</span>
                      <span>F: {food.fat}g</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {food.dietaryTags?.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="h-5 px-2 text-xs capitalize"
                        >
                          {tag.replace("-", " ")}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={food.isAvailable ? "success" : "secondary"}>
                      {food.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{food.preparationTime} min</span>
                    </div>
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
                          onClick={() => handleAvailabilityChange(food)}
                        >
                          {food.isAvailable ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {food.isAvailable
                            ? "Make Unavailable"
                            : "Make Available"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedFood(food);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 text-destructive" />
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
            itemLabel="items"
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Food Item"
        description={`Are you sure you want to delete ${selectedFood?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}

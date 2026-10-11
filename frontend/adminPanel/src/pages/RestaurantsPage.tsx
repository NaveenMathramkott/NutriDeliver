"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  MoreVertical,
  CheckCircle2,
  XCircle,
  Store,
  MapPin,
  Star,
} from "lucide-react";
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
import type { Restaurant } from "@/types";
import {
  VerifyRestaurantDialog,
  RESTAURANT_STATUS_OPTIONS,
  RESTAURANT_VERIFIED_OPTIONS,
} from "@/features/restaurants";

const PAGE_SIZE = 10;

export function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getRestaurants({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchQuery,
        status: statusFilter,
        verified: verifiedFilter === "" ? undefined : verifiedFilter === "true",
      });
      if (response.success && response.data) {
        const data = response.data as {
          restaurants: Restaurant[];
          pagination: { current: number; pages: number; total: number };
        };
        setRestaurants(data.restaurants);
        setTotalPages(data.pagination.pages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
      toast({
        title: "Error",
        description: "Failed to fetch restaurants",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, verifiedFilter]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleVerify = async (restaurant: Restaurant, isVerified: boolean) => {
    setIsSubmitting(true);
    try {
      const response = await api.verifyRestaurant(restaurant._id);
      if (response.success) {
        toast({
          title: "Success",
          description: `Restaurant ${isVerified ? "unverified" : "verified"}`,
          variant: "success",
        });
        setIsVerifyDialogOpen(false);
        fetchRestaurants();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update verification",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (
    restaurant: Restaurant,
    isActive: boolean,
  ) => {
    setIsSubmitting(true);
    try {
      const response = await api.updateRestaurantStatus(
        restaurant._id,
        isActive ? "active" : "inactive",
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `Restaurant ${isActive ? "activated" : "deactivated"}`,
          variant: "success",
        });
        fetchRestaurants();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update restaurant status",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRestaurant) return;
    try {
      const response = await api.updateRestaurantStatus(
        selectedRestaurant._id,
        "inactive",
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Restaurant deactivated",
          variant: "success",
        });
        setIsDeleteDialogOpen(false);
        fetchRestaurants();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to deactivate restaurant",
        variant: "destructive",
      });
    }
  };

  const openVerifyDialog = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsVerifyDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurant Management"
        description="Manage restaurants on the platform"
      />

      <Card>
        <CardHeader>
          <CardTitle>Restaurants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search restaurants..."
            onSearch={() => setCurrentPage(1)}
            filters={[
              {
                key: "status",
                label: "All Statuses",
                value: statusFilter,
                onValueChange: setStatusFilter,
                options: RESTAURANT_STATUS_OPTIONS,
              },
              {
                key: "verified",
                label: "All Verification",
                value: verifiedFilter,
                onValueChange: setVerifiedFilter,
                options: RESTAURANT_VERIFIED_OPTIONS,
              },
            ]}
          />

          <DataTable>
            <DataTableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Cuisine</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </DataTableHead>
            <DataTableBody>
              <TableState
                isLoading={isLoading}
                isEmpty={restaurants.length === 0}
                colSpan={9}
                emptyMessage="No restaurants found"
              />
              {restaurants.map((restaurant) => (
                <DataTableRow key={restaurant._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="max-w-[220px] truncate text-sm text-muted-foreground">
                          {restaurant.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {restaurant.contact?.email || "N/A"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {restaurant.cuisineType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={restaurant.isActive ? "success" : "secondary"}
                      className="capitalize"
                    >
                      {restaurant.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={restaurant.isVerified ? "success" : "warning"}
                    >
                      {restaurant.isVerified ? "Verified" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{restaurant.rating?.toFixed(1) || "0.0"}</span>
                      <span className="text-xs text-muted-foreground">
                        ({restaurant.totalReviews})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 text-sm">
                      <span>
                        $
                        {restaurant.deliverySettings?.deliveryFee?.toFixed(2) ||
                          "0.00"}{" "}
                        fee
                      </span>
                      <span className="text-muted-foreground">
                        Min $
                        {restaurant.deliverySettings?.minOrderAmount?.toFixed(
                          2,
                        ) || "0.00"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="max-w-[150px] truncate">
                        {restaurant.contact?.address?.street},{" "}
                        {restaurant.contact?.address?.city}
                      </span>
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
                          onClick={() => openVerifyDialog(restaurant)}
                        >
                          {restaurant.isVerified ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {restaurant.isVerified ? "Unverify" : "Verify"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(restaurant, !restaurant.isActive)
                          }
                        >
                          {restaurant.isActive ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {restaurant.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRestaurant(restaurant);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 text-destructive" />
                          <span className="text-destructive">Deactivate</span>
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
            itemLabel="restaurants"
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Deactivate Restaurant"
        description={`Are you sure you want to deactivate ${selectedRestaurant?.name}? This will hide it from customers.`}
        confirmLabel="Deactivate"
        onConfirm={handleDelete}
      />

      <VerifyRestaurantDialog
        open={isVerifyDialogOpen}
        onOpenChange={setIsVerifyDialogOpen}
        restaurantName={selectedRestaurant?.name}
        isVerified={Boolean(selectedRestaurant?.isVerified)}
        isSubmitting={isSubmitting}
        onSubmit={() =>
          selectedRestaurant &&
          handleVerify(selectedRestaurant, !selectedRestaurant.isVerified)
        }
      />
    </div>
  );
}

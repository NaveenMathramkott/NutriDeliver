"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Store,
  MapPin,
  Phone,
  Mail,
  Star,
  Truck,
  Shield,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Restaurant } from "@/types";

const statusColors = {
  true: "success" as const,
  false: "secondary" as const,
};

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

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const response = await api.getRestaurants({
        page: currentPage,
        limit: 10,
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
  };

  useEffect(() => {
    fetchRestaurants();
  }, [currentPage, searchQuery, statusFilter, verifiedFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRestaurants();
  };

  const handleVerify = async (restaurant: Restaurant, isVerified: boolean) => {
    try {
      const response = await api.verifyRestaurant(restaurant._id);
      if (response.success) {
        toast({
          title: "Success",
          description: `Restaurant ${isVerified ? "unverified" : "verified"}`,
          variant: "success",
        });
        fetchRestaurants();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update verification",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    restaurant: Restaurant,
    isActive: boolean,
  ) => {
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update restaurant status",
        variant: "destructive",
      });
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
        fetchRestaurants();
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Restaurant Management
          </h1>
          <p className="text-muted-foreground">
            Manage restaurants on the platform
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Restaurants</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-4 flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Cuisine</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : restaurants.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No restaurants found
                    </TableCell>
                  </TableRow>
                ) : (
                  restaurants.map((restaurant) => (
                    <TableRow key={restaurant._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Store className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{restaurant.name}</p>
                            <p className="text-sm text-muted-foreground">
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
                          variant={
                            restaurant.isActive ? "success" : "secondary"
                          }
                          className="capitalize"
                        >
                          {restaurant.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            restaurant.isVerified ? "success" : "warning"
                          }
                        >
                          {restaurant.isVerified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{restaurant.rating?.toFixed(1) || "0.0"}</span>
                          <span className="text-xs text-muted-foreground">
                            ({restaurant.totalReviews} reviews)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span>
                            $
                            {restaurant.deliverySettings?.deliveryFee?.toFixed(
                              2,
                            ) || "0.00"}{" "}
                            fee
                          </span>
                          <span className="text-muted-foreground">
                            Min: $
                            {restaurant.deliverySettings?.minOrderAmount?.toFixed(
                              2,
                            ) || "0.00"}
                          </span>
                          <span className="text-muted-foreground">
                            {restaurant.deliverySettings?.deliveryRadius}km
                            radius
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">
                            {restaurant.contact?.address?.street},{" "}
                            {restaurant.contact?.address?.city},{" "}
                            {restaurant.contact?.address?.state}
                          </span>
                        </div>
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
                              onClick={() =>
                                handleVerify(restaurant, !restaurant.isVerified)
                              }
                            >
                              {restaurant.isVerified ? (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Unverify
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Verify
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(
                                  restaurant,
                                  !restaurant.isActive,
                                )
                              }
                            >
                              {restaurant.isActive ? (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedRestaurant(restaurant);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                              <span className="text-destructive">
                                Deactivate
                              </span>
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
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
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

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 10 + 1} to{" "}
            {Math.min(currentPage * 10, total)} of {total} restaurants
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Restaurant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {selectedRestaurant?.name}?
              This will hide it from customers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Restaurant</DialogTitle>
            <DialogDescription>
              {selectedRestaurant?.isVerified ? "Unverify" : "Verify"}{" "}
              {selectedRestaurant?.name}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVerifyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleVerify(
                  selectedRestaurant!,
                  !selectedRestaurant!.isVerified,
                );
                setIsVerifyDialogOpen(false);
              }}
            >
              {selectedRestaurant?.isVerified ? "Unverify" : "Verify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

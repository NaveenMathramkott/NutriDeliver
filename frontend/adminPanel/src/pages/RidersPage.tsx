"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MoreVertical, Eye, ShieldCheck, Truck, Star } from "lucide-react";
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
import type { RiderProfile, User } from "@/types";
import {
  RiderDetailDialog,
  RiderStatusDialog,
  VerifyRiderDialog,
  RIDER_STATUS_OPTIONS,
  RIDER_VERIFIED_OPTIONS,
  availabilityBadge,
  type RiderAvailability,
} from "@/features/riders";

const PAGE_SIZE = 10;
type Rider = User & { riderProfile: RiderProfile };

export function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState<RiderAvailability>("available");

  const fetchRiders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getRiders({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchQuery,
        status: statusFilter,
        verified: verifiedFilter === "" ? undefined : verifiedFilter === "true",
      });
      if (response.success && response.data) {
        const data = response.data as {
          riders: Rider[];
          pagination: { current: number; pages: number; total: number };
        };
        setRiders(data.riders);
        setTotalPages(data.pagination.pages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch riders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch riders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, verifiedFilter]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  const handleVerify = async (rider: Rider, isVerified: boolean) => {
    setIsSubmitting(true);
    try {
      const response = await api.verifyRider(rider._id);
      if (response.success) {
        toast({
          title: "Success",
          description: `Rider ${isVerified ? "unverified" : "verified"}`,
          variant: "success",
        });
        setIsVerifyDialogOpen(false);
        fetchRiders();
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
    rider: Rider,
    status: RiderAvailability,
  ) => {
    setIsSubmitting(true);
    try {
      const response = await api.updateRiderStatus(
        rider._id,
        status === "available" ? "active" : "inactive",
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `Rider marked as ${status}`,
          variant: "success",
        });
        setIsStatusDialogOpen(false);
        fetchRiders();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update rider status",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetailDialog = (rider: Rider) => {
    setSelectedRider(rider);
    setIsDetailDialogOpen(true);
  };

  const openVerifyDialog = (rider: Rider) => {
    setSelectedRider(rider);
    setIsVerifyDialogOpen(true);
  };

  const openStatusDialog = (rider: Rider) => {
    setSelectedRider(rider);
    setNewStatus(rider.riderProfile?.availabilityStatus?.status || "offline");
    setIsStatusDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rider Management"
        description="Manage delivery riders"
      />

      <Card>
        <CardHeader>
          <CardTitle>Riders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search riders..."
            onSearch={() => setCurrentPage(1)}
            filters={[
              {
                key: "status",
                label: "All Statuses",
                value: statusFilter,
                onValueChange: setStatusFilter,
                options: RIDER_STATUS_OPTIONS,
              },
              {
                key: "verified",
                label: "All Verification",
                value: verifiedFilter,
                onValueChange: setVerifiedFilter,
                options: RIDER_VERIFIED_OPTIONS,
              },
            ]}
          />

          <DataTable>
            <DataTableHead>
              <TableHead>Rider</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Deliveries</TableHead>
              <TableHead>Earnings</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </DataTableHead>
            <DataTableBody>
              <TableState
                isLoading={isLoading}
                isEmpty={riders.length === 0}
                colSpan={8}
                emptyMessage="No riders found"
              />
              {riders.map((rider) => (
                <DataTableRow key={rider._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={rider.profile.avatar}
                          alt={rider.profile.firstName}
                        />
                        <AvatarFallback>
                          {rider.profile.firstName?.charAt(0).toUpperCase() ||
                            "R"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {rider.profile.firstName} {rider.profile.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {rider.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="capitalize">
                        {rider.riderProfile?.vehicleType || "N/A"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {rider.riderProfile?.vehicleNumber || ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={availabilityBadge(
                        rider.riderProfile?.availabilityStatus?.status,
                      )}
                      className="capitalize"
                    >
                      {rider.riderProfile?.availabilityStatus?.status ||
                        "offline"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rider.isVerified ? "success" : "warning"}>
                      {rider.isVerified ? "Verified" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>N/A</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {rider.riderProfile?.earnings?.totalDeliveries || 0}
                  </TableCell>
                  <TableCell>
                    $
                    {rider.riderProfile?.earnings?.totalEarnings?.toFixed(2) ||
                      "0.00"}
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
                          onClick={() => openDetailDialog(rider)}
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {!rider.isVerified && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openVerifyDialog(rider)}
                            >
                              <ShieldCheck className="h-4 w-4" />
                              Verify Rider
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openStatusDialog(rider)}
                        >
                          <Truck className="h-4 w-4" />
                          Update Status
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
          <p className="text-sm text-muted-foreground">{total} riders</p>
        </CardContent>
      </Card>

      <RiderDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        rider={selectedRider}
      />

      <VerifyRiderDialog
        open={isVerifyDialogOpen}
        onOpenChange={setIsVerifyDialogOpen}
        riderName={`${selectedRider?.profile.firstName} ${selectedRider?.profile.lastName}`}
        isVerified={Boolean(selectedRider?.isVerified)}
        isSubmitting={isSubmitting}
        onSubmit={(e) => {
          e.preventDefault();
          if (selectedRider)
            handleVerify(selectedRider, !selectedRider.isVerified);
        }}
      />

      <RiderStatusDialog
        open={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
        riderName={`${selectedRider?.profile.firstName} ${selectedRider?.profile.lastName}`}
        status={newStatus}
        onStatusChange={setNewStatus}
        isSubmitting={isSubmitting}
        onSubmit={(e) => {
          e.preventDefault();
          if (selectedRider) handleStatusChange(selectedRider, newStatus);
        }}
      />
    </div>
  );
}

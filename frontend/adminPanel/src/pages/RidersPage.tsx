"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  MoreVertical,
  Truck,
  CheckCircle2,
  XCircle,
  Shield,
  MapPin,
  DollarSign,
  Star,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Shield as ShieldIcon,
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
import type { User, RiderProfile, VehicleType } from "@/types";

const statusColors = {
  available: "success" as const,
  busy: "warning" as const,
  offline: "secondary" as const,
};

export function RidersPage() {
  const [riders, setRiders] = useState<
    (User & { riderProfile: RiderProfile })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedRider, setSelectedRider] = useState<
    (User & { riderProfile: RiderProfile }) | null
  >(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<"available" | "busy" | "offline">(
    "available",
  );

  const fetchRiders = async () => {
    setIsLoading(true);
    try {
      const response = await api.getRiders({
        page: currentPage,
        limit: 10,
        search: searchQuery,
        status: statusFilter,
        verified: verifiedFilter === "" ? undefined : verifiedFilter === "true",
      });
      if (response.success && response.data) {
        const data = response.data as {
          riders: (User & { riderProfile: RiderProfile })[];
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
  };

  useEffect(() => {
    fetchRiders();
  }, [currentPage, searchQuery, statusFilter, verifiedFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRiders();
  };

  const handleVerify = async (
    rider: User & { riderProfile: RiderProfile },
    isVerified: boolean,
  ) => {
    try {
      const response = await api.verifyRider(rider._id);
      if (response.success) {
        toast({
          title: "Success",
          description: `Rider ${isVerified ? "unverified" : "verified"}`,
          variant: "success",
        });
        fetchRiders();
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
    rider: User & { riderProfile: RiderProfile },
    isActive: boolean,
  ) => {
    try {
      const response = await api.updateRiderStatus(
        rider._id,
        isActive ? "active" : "inactive",
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `Rider ${isActive ? "activated" : "deactivated"}`,
          variant: "success",
        });
        fetchRiders();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update rider status",
        variant: "destructive",
      });
    }
  };

  const openDetailDialog = (rider: User & { riderProfile: RiderProfile }) => {
    setSelectedRider(rider);
    setIsDetailDialogOpen(true);
  };
  const openVerifyDialog = (rider: User & { riderProfile: RiderProfile }) => {
    setSelectedRider(rider);
    setIsVerifyDialogOpen(true);
  };
  const openStatusDialog = (rider: User & { riderProfile: RiderProfile }) => {
    setSelectedRider(rider);
    setNewStatus(rider.riderProfile?.availabilityStatus?.status || "offline");
    setIsStatusDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Rider Management
          </h1>
          <p className="text-muted-foreground">Manage delivery riders</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riders</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-4 flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search riders..."
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
                <SelectItem value="">All</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
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
                  <TableHead>Rider</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Deliveries</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : riders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No riders found
                    </TableCell>
                  </TableRow>
                ) : (
                  riders.map((rider) => (
                    <TableRow key={rider._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={rider.profile.avatar}
                              alt={rider.profile.firstName}
                            />
                            <AvatarFallback>
                              {rider.profile.firstName
                                ?.charAt(0)
                                .toUpperCase() || "R"}
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
                            {rider.riderProfile?.vehicleNumber || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusColors[
                              rider.riderProfile?.availabilityStatus
                                ?.status as keyof typeof statusColors
                            ] || "secondary"
                          }
                        >
                          {rider.riderProfile?.availabilityStatus?.status ||
                            "offline"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rider.isVerified ? "success" : "warning"}
                        >
                          {rider.isVerified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>N/A</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {rider.riderProfile?.earnings?.totalDeliveries || 0}
                      </TableCell>
                      <TableCell>
                        $
                        {rider.riderProfile?.earnings?.totalEarnings?.toFixed(
                          2,
                        ) || "0.00"}
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
                              onClick={() => openDetailDialog(rider)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {!rider.isVerified && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openVerifyDialog(rider)}
                                >
                                  <ShieldIcon className="mr-2 h-4 w-4" />
                                  Verify Rider
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openStatusDialog(rider)}
                            >
                              <Truck className="mr-2 h-4 w-4" />
                              Update Status
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

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRider?.profile.firstName}{" "}
              {selectedRider?.profile.lastName}
            </DialogTitle>
            <DialogDescription>Rider Details</DialogDescription>
          </DialogHeader>
          {selectedRider && (
            <div className="space-y-4 py-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{selectedRider.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">
                  {selectedRider.profile.phone || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Vehicle</p>
                <p className="font-medium capitalize">
                  {selectedRider.riderProfile?.vehicleType} -{" "}
                  {selectedRider.riderProfile?.vehicleNumber}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">License</p>
                <p className="font-medium">
                  {selectedRider.riderProfile?.licenseNumber}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge
                  variant={
                    statusColors[
                      selectedRider.riderProfile?.availabilityStatus
                        ?.status as keyof typeof statusColors
                    ] || "secondary"
                  }
                >
                  {selectedRider.riderProfile?.availabilityStatus?.status}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Verified</p>
                <Badge
                  variant={selectedRider.isVerified ? "success" : "warning"}
                >
                  {selectedRider.isVerified ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Total Deliveries</p>
                <p className="font-medium">
                  {selectedRider.riderProfile?.earnings?.totalDeliveries || 0}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Earnings</p>
                <p className="font-medium">
                  $
                  {selectedRider.riderProfile?.earnings?.totalEarnings?.toFixed(
                    2,
                  ) || "0.00"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Documents</p>
                <div className="space-y-1">
                  {selectedRider.riderProfile?.documents?.map((doc) => (
                    <div
                      key={doc.type}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Badge variant="secondary" className="capitalize">
                        {doc.type}
                      </Badge>
                      <span className="text-muted-foreground">
                        {format(new Date(doc.uploadedAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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

      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Rider</DialogTitle>
            <DialogDescription>
              Verify {selectedRider?.profile.firstName}{" "}
              {selectedRider?.profile.lastName} to allow them to accept
              deliveries.
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
                handleVerify(selectedRider!, !selectedRider!.isVerified);
                setIsVerifyDialogOpen(false);
              }}
            >
              {selectedRider?.isVerified ? "Unverify" : "Verify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Rider Status</DialogTitle>
            <DialogDescription>
              Change status for {selectedRider?.profile.firstName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={newStatus}
              onValueChange={(value: "available" | "busy" | "offline") =>
                setNewStatus(value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleStatusChange(selectedRider!, newStatus === "available");
                setIsStatusDialogOpen(false);
              }}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

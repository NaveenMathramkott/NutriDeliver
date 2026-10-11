"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Plus,
  Tag,
  Edit,
  Trash2,
  Percent,
  Tag as TagIcon,
  Truck,
  Calendar,
  CheckCircle2,
  XCircle,
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

const statusColors: Record<
  string,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  active: "success",
  inactive: "secondary",
};

const typeColors: Record<
  string,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  percentage: "default",
  fixed: "success",
  free_delivery: "warning",
};

export function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "percentage",
    value: 0,
    minOrderAmount: 0,
    maxDiscount: 0,
    usageLimit: 0,
    userLimit: 1,
    startDate: "",
    endDate: "",
    isActive: true,
    applicableRestaurants: [],
    applicableCategories: [],
  });

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      const response = await api.getOffers({
        page: currentPage,
        limit: 10,
        isActive:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
              ? false
              : undefined,
      });
      if (response.success && response.data) {
        let filtered = response.data.data;
        if (searchQuery) {
          filtered = filtered.filter(
            (o) =>
              o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
              o.name.toLowerCase().includes(searchQuery.toLowerCase()),
          );
        }
        setTotal(filtered.length);
        setTotalPages(Math.ceil(filtered.length / 10));
        setOffers(filtered.slice((currentPage - 1) * 10, currentPage * 10));
      }
    } catch (error) {
      console.error("Failed to fetch offers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch offers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [currentPage, searchQuery, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOffers();
  };

  const openCreateDialog = () => {
    setIsEditing(false);
    setSelectedOffer(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      type: "percentage",
      value: 0,
      minOrderAmount: 0,
      maxDiscount: 0,
      usageLimit: 0,
      userLimit: 1,
      startDate: "",
      endDate: "",
      isActive: true,
      applicableRestaurants: [],
      applicableCategories: [],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (offer: any) => {
    setIsEditing(true);
    setSelectedOffer(offer);
    setFormData({
      code: offer.code,
      name: offer.name,
      description: offer.description || "",
      type: offer.type,
      value: offer.value,
      minOrderAmount: offer.minOrderAmount,
      maxDiscount: offer.maxDiscount || 0,
      usageLimit: offer.usageLimit,
      userLimit: offer.userLimit,
      startDate: offer.startDate?.split("T")[0] || "",
      endDate: offer.endDate?.split("T")[0] || "",
      isActive: offer.isActive,
      applicableRestaurants: offer.applicableRestaurants || [],
      applicableCategories: offer.applicableCategories || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = isEditing
        ? await api.updateOffer(selectedOffer!.id, formData)
        : await api.createOffer(formData);
      if (response.success) {
        toast({
          title: "Success",
          description: isEditing ? "Offer updated" : "Offer created",
          variant: "success",
        });
        fetchOffers();
        setIsDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: isEditing
          ? "Failed to update offer"
          : "Failed to create offer",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedOffer) return;
    try {
      const response = await api.deleteOffer(selectedOffer.id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Offer deleted",
          variant: "success",
        });
        fetchOffers();
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete offer",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Offer Management
          </h1>
          <p className="text-muted-foreground">
            Manage promotional offers and discounts
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Offer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-4 flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search offers..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : offers?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No offers found
                    </TableCell>
                  </TableRow>
                ) : (
                  offers?.map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell>
                        <p className="font-mono font-medium">{offer.code}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{offer.name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {offer.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={typeColors[offer.type] || "default"}
                          className="capitalize"
                        >
                          {offer.type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {offer.type === "percentage"
                          ? `${offer.value}%`
                          : offer.type === "fixed"
                            ? `$${offer.value}`
                            : "Free Delivery"}
                      </TableCell>
                      <TableCell>${offer.minOrderAmount}</TableCell>
                      <TableCell>
                        {offer.usageCount}/{offer.usageLimit}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(offer.startDate), "MMM dd")} -{" "}
                          {format(new Date(offer.endDate), "MMM dd")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={offer.isActive ? "success" : "secondary"}
                        >
                          {offer.isActive ? "Active" : "Inactive"}
                        </Badge>
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
                              onClick={() => openEditDialog(offer)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOffer(offer);
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
            <AlertDialogTitle>Delete Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedOffer?.name}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Offer" : "Create Offer"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update offer details"
                : "Create a new promotional offer"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="SAVE20"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Summer Sale"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="20% off on orders above $30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="free_delivery">Free Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                value={formData.value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    value: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder={
                  formData.type === "percentage"
                    ? "20"
                    : formData.type === "fixed"
                      ? "10.00"
                      : "N/A"
                }
                required
                disabled={formData.type === "free_delivery"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minOrderAmount">Min Order Amount *</Label>
              <Input
                id="minOrderAmount"
                type="number"
                step="0.01"
                min="0"
                value={formData.minOrderAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minOrderAmount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="30.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDiscount">Max Discount (for percentage)</Label>
              <Input
                id="maxDiscount"
                type="number"
                step="0.01"
                min="0"
                value={formData.maxDiscount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxDiscount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="50.00"
                disabled={formData.type !== "percentage"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usageLimit">Usage Limit *</Label>
              <Input
                id="usageLimit"
                type="number"
                min="1"
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usageLimit: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userLimit">User Limit *</Label>
              <Input
                id="userLimit"
                type="number"
                min="1"
                value={formData.userLimit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    userLimit: parseInt(e.target.value) || 1,
                  })
                }
                placeholder="1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form={undefined}
              onClick={() => document.querySelector("form")?.requestSubmit()}
            >
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

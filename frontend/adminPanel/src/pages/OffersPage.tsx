"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
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
import type { Offer } from "@/types";

const typeColors = {
  percentage: "default" as const,
  fixed: "success" as const,
};

export function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{
    code: string;
    title: string;
    description: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    minOrderAmount: number;
    maxDiscount: number;
    usageLimit: number;
    usedCount: number;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
    applicableCategories: string[];
    applicableRestaurants: string[];
  }>({
    code: "",
    title: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscount: 0,
    usageLimit: 0,
    usedCount: 0,
    validFrom: "",
    validUntil: "",
    isActive: true,
    applicableCategories: [],
    applicableRestaurants: [],
  });

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      const response = await api.getOffers({
        page: currentPage,
        limit: 10,
        isActive:
          statusFilter === "true"
            ? true
            : statusFilter === "false"
              ? false
              : undefined,
      });
      if (response.success && response.data) {
        const data = response.data as {
          offers: Offer[];
          pagination: { current: number; pages: number; total: number };
        };
        setOffers(data.offers);
        setTotalPages(data.pagination.pages);
        setTotal(data.pagination.total);
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
      title: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      minOrderAmount: 0,
      maxDiscount: 0,
      usageLimit: 0,
      usedCount: 0,
      validFrom: "",
      validUntil: "",
      isActive: true,
      applicableCategories: [],
      applicableRestaurants: [],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (offer: Offer) => {
    setIsEditing(true);
    setSelectedOffer(offer);
    setFormData({
      code: offer.code,
      title: offer.title,
      description: offer.description,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      minOrderAmount: offer.minOrderAmount,
      maxDiscount: offer.maxDiscount || 0,
      usageLimit: offer.usageLimit || 0,
      usedCount: offer.usedCount,
      validFrom: offer.validFrom?.split("T")[0] || "",
      validUntil: offer.validUntil?.split("T")[0] || "",
      isActive: offer.isActive,
      applicableCategories: offer.applicableCategories || [],
      applicableRestaurants: offer.applicableRestaurants || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let response;
      if (isEditing && selectedOffer) {
        response = await api.updateOffer(selectedOffer._id, formData);
      } else {
        response = await api.createOffer(formData);
      }
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
      const response = await api.deleteOffer(selectedOffer._id);
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
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
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
                ) : offers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No offers found
                    </TableCell>
                  </TableRow>
                ) : (
                  offers.map((offer) => (
                    <TableRow key={offer._id}>
                      <TableCell>
                        <p className="font-mono font-medium">{offer.code}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{offer.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {offer.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={typeColors[offer.discountType] || "default"}
                          className="capitalize"
                        >
                          {offer.discountType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {offer.discountType === "percentage"
                          ? `${offer.discountValue}%`
                          : `$${offer.discountValue.toFixed(2)}`}
                        {offer.maxDiscount &&
                          offer.discountType === "percentage" && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (max ${offer.maxDiscount})
                            </span>
                          )}
                      </TableCell>
                      <TableCell>${offer.minOrderAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        {offer.usedCount}/{offer.usageLimit || "∞"}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(offer.validFrom), "MMM dd")} -{" "}
                          {format(new Date(offer.validUntil), "MMM dd, yyyy")}
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
              Are you sure you want to delete {selectedOffer?.title}? This
              action cannot be undone.
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
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
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
              <Label htmlFor="discountType">Type *</Label>
              <Select
                value={formData.discountType}
                onValueChange={(v: "percentage" | "fixed") =>
                  setFormData({ ...formData, discountType: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountValue">Value *</Label>
              <Input
                id="discountValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountValue: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder={
                  formData.discountType === "percentage" ? "20" : "10.00"
                }
                required
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
                disabled={formData.discountType !== "percentage"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usageLimit">Usage Limit</Label>
              <Input
                id="usageLimit"
                type="number"
                min="0"
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usageLimit: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="100 (0 = unlimited)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From *</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, validFrom: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData({ ...formData, validUntil: e.target.value })
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
              onClick={() => {
                document.querySelector("form")?.requestSubmit();
              }}
            >
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedOffer?.title}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

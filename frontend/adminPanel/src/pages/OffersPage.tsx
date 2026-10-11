"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
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
import type { Offer } from "@/types";
import {
  OfferFormDialog,
  emptyOfferForm,
  DISCOUNT_TYPE_COLORS,
  toDateInputValue,
  type OfferFormValues,
} from "@/features/offers";

const PAGE_SIZE = 10;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<OfferFormValues>(emptyOfferForm);

  const fetchOffers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getOffers({
        page: currentPage,
        limit: PAGE_SIZE,
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
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const openCreateDialog = () => {
    setIsEditing(false);
    setSelectedOffer(null);
    setFormValues(emptyOfferForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (offer: Offer) => {
    setIsEditing(true);
    setSelectedOffer(offer);
    setFormValues({
      code: offer.code,
      title: offer.title,
      description: offer.description,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      minOrderAmount: offer.minOrderAmount,
      maxDiscount: offer.maxDiscount || 0,
      usageLimit: offer.usageLimit || 0,
      usedCount: offer.usedCount,
      validFrom: toDateInputValue(offer.validFrom),
      validUntil: toDateInputValue(offer.validUntil),
      isActive: offer.isActive,
      applicableCategories: offer.applicableCategories || [],
      applicableRestaurants: offer.applicableRestaurants || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response =
        isEditing && selectedOffer
          ? await api.updateOffer(selectedOffer._id, formValues)
          : await api.createOffer(formValues);

      if (response.success) {
        toast({
          title: "Success",
          description: isEditing ? "Offer updated" : "Offer created",
          variant: "success",
        });
        setIsDialogOpen(false);
        fetchOffers();
      }
    } catch {
      toast({
        title: "Error",
        description: isEditing
          ? "Failed to update offer"
          : "Failed to create offer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
        setIsDeleteDialogOpen(false);
        fetchOffers();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete offer",
        variant: "destructive",
      });
    }
  };

  const visibleOffers = searchQuery
    ? offers.filter((offer) =>
        `${offer.code} ${offer.title} ${offer.description}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )
    : offers;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offer Management"
        description="Manage promotional offers and discounts"
        action={<Button onClick={openCreateDialog}>Create Offer</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Offers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search offers..."
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
              <TableHead>Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Min Order</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Validity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </DataTableHead>
            <DataTableBody>
              <TableState
                isLoading={isLoading}
                isEmpty={visibleOffers.length === 0}
                colSpan={9}
                emptyMessage="No offers found"
              />
              {visibleOffers.map((offer) => (
                <DataTableRow key={offer._id}>
                  <TableCell>
                    <p className="font-mono font-medium">{offer.code}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{offer.title}</p>
                    <p className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {offer.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={DISCOUNT_TYPE_COLORS[offer.discountType]}
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
                        <span className="ml-1 text-xs text-muted-foreground">
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
                    <Badge variant={offer.isActive ? "success" : "secondary"}>
                      {offer.isActive ? "Active" : "Inactive"}
                    </Badge>
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
                        <DropdownMenuItem onClick={() => openEditDialog(offer)}>
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedOffer(offer);
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
          <p className="text-sm text-muted-foreground">{total} offers</p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Offer"
        description={`Are you sure you want to delete ${selectedOffer?.title}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />

      <OfferFormDialog
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

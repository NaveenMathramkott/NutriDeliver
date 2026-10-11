import type { ApiResponse, PaginatedResponse } from "@/types";
import { apiClient } from "./client";

export const ridersApi = {
  // Rider registration
  async register(data: any) {
    const response = await apiClient.post<ApiResponse<any>>(
      "/riders/register",
      data,
    );
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get<ApiResponse<any>>("/riders/profile");
    return response.data;
  },

  async updateProfile(data: any) {
    const response = await apiClient.put<ApiResponse<any>>(
      "/riders/profile",
      data,
    );
    return response.data;
  },

  async uploadDocuments(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("documents", file));
    const response = await apiClient.post<ApiResponse<any>>(
      "/riders/documents",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  async updateAvailability(status: string) {
    const response = await apiClient.put<ApiResponse<any>>(
      "/riders/availability",
      { status },
    );
    return response.data;
  },

  async updateLocation(location: { lat: number; lng: number }) {
    const response = await apiClient.put<ApiResponse<any>>(
      "/riders/location",
      location,
    );
    return response.data;
  },

  async getAvailableOrders() {
    const response = await apiClient.get<ApiResponse<any>>(
      "/riders/orders/available",
    );
    return response.data;
  },

  async acceptOrder(orderId: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      `/riders/orders/${orderId}/accept`,
    );
    return response.data;
  },

  async rejectOrder(orderId: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      `/riders/orders/${orderId}/reject`,
    );
    return response.data;
  },

  async getCurrentOrder() {
    const response = await apiClient.get<ApiResponse<any>>(
      "/riders/orders/current",
    );
    return response.data;
  },

  async getHistory(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get<ApiResponse<any>>(
      "/riders/orders/history",
      { params },
    );
    return response.data;
  },

  async confirmPickup(orderId: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      `/riders/orders/${orderId}/confirm-pickup`,
    );
    return response.data;
  },

  async confirmDelivery(orderId: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      `/riders/orders/${orderId}/confirm-delivery`,
    );
    return response.data;
  },

  async getEarnings(period?: string) {
    const endpoint = period ? `/riders/earnings/${period}` : "/riders/earnings";
    const response = await apiClient.get<ApiResponse<any>>(endpoint);
    return response.data;
  },

  async getStats() {
    const response = await apiClient.get<ApiResponse<any>>("/riders/stats");
    return response.data;
  },

  async getRatings() {
    const response = await apiClient.get<ApiResponse<any>>("/riders/ratings");
    return response.data;
  },

  // Admin
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    verified?: boolean;
  }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/admin/riders",
      { params },
    );
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get<ApiResponse<any>>(
      `/admin/riders/${id}`,
    );
    return response.data;
  },

  async verify(id: string) {
    const response = await apiClient.put<ApiResponse<any>>(
      `/admin/riders/${id}/verify`,
    );
    return response.data;
  },

  async updateStatus(id: string, status: string) {
    const response = await apiClient.put<ApiResponse<any>>(
      `/admin/riders/${id}/status`,
      { status },
    );
    return response.data;
  },
};

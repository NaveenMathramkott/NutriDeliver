import type { ApiResponse, PaginatedResponse } from "@/types";
import { apiClient } from "./client";

export const restaurantsApi = {
  // Public
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    cuisine?: string;
  }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/restaurants",
      { params },
    );
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get<ApiResponse<any>>(
      `/restaurants/${id}`,
    );
    return response.data;
  },

  async getMenu(id: string) {
    const response = await apiClient.get<ApiResponse<any>>(
      `/restaurants/${id}/menu`,
    );
    return response.data;
  },

  async getStatus(id: string) {
    const response = await apiClient.get<ApiResponse<any>>(
      `/restaurants/${id}/status`,
    );
    return response.data;
  },

  async checkDelivery(id: string, address: any) {
    const response = await apiClient.post<ApiResponse<any>>(
      `/restaurants/${id}/check-delivery`,
      address,
    );
    return response.data;
  },

  // Restaurant owner
  async getOwnProfile() {
    const response = await apiClient.get<ApiResponse<any>>(
      "/restaurants/restaurant",
    );
    return response.data;
  },

  async create(data: any) {
    const response = await apiClient.post<ApiResponse<any>>(
      "/restaurants",
      data,
    );
    return response.data;
  },

  async update(data: any) {
    const response = await apiClient.put<ApiResponse<any>>(
      "/restaurants/restaurant",
      data,
    );
    return response.data;
  },

  async toggleStatus() {
    const response = await apiClient.put<ApiResponse<any>>(
      "/restaurants/restaurant/toggle-status",
    );
    return response.data;
  },

  async getOrders(params?: { page?: number; limit?: number; status?: string }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/restaurants/restaurant/orders",
      { params },
    );
    return response.data;
  },

  async respondToOrder(orderId: string, accept: boolean) {
    const response = await apiClient.post<ApiResponse<any>>(
      `/restaurants/restaurant/orders/${orderId}/respond`,
      { accept },
    );
    return response.data;
  },

  async updateOrderStatus(orderId: string, status: string) {
    const response = await apiClient.put<ApiResponse<any>>(
      `/restaurants/restaurant/orders/${orderId}/status`,
      { status },
    );
    return response.data;
  },

  async getAnalytics() {
    const response = await apiClient.get<ApiResponse<any>>(
      "/restaurants/restaurant/analytics",
    );
    return response.data;
  },

  async uploadImages(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const response = await apiClient.post<ApiResponse<any>>(
      "/restaurants/restaurant/images",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  // Admin
  async getAllAdmin(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    verified?: boolean;
  }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/admin/restaurants",
      { params },
    );
    return response.data;
  },

  async getByIdAdmin(id: string) {
    const response = await apiClient.get<ApiResponse<any>>(
      `/admin/restaurants/${id}`,
    );
    return response.data;
  },

  async verify(id: string) {
    const response = await apiClient.put<ApiResponse<any>>(
      `/admin/restaurants/${id}/verify`,
    );
    return response.data;
  },

  async updateStatus(id: string, status: string) {
    const response = await apiClient.put<ApiResponse<any>>(
      `/admin/restaurants/${id}/status`,
      { status },
    );
    return response.data;
  },
};

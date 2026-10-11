import type { ApiResponse, PaginatedResponse } from "../../types";
import { apiClient } from "./client";

export const ordersApi = {
  // User
  async create(data: any) {
    const response = await apiClient.post<ApiResponse<any>>("/orders", data);
    return response.data;
  },

  async getUserOrders(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/orders",
      { params },
    );
    return response.data;
  },

  async getById(orderId: string) {
    const response = await apiClient.get<ApiResponse<any>>(
      `/orders/${orderId}`,
    );
    return response.data;
  },

  async cancel(orderId: string) {
    const response = await apiClient.put<ApiResponse<any>>(
      `/orders/${orderId}/cancel`,
    );
    return response.data;
  },

  async rate(orderId: string, rating: number, review?: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      `/orders/${orderId}/rate`,
      { rating, review },
    );
    return response.data;
  },

  // Restaurant
  async getRestaurantOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/orders/restaurant/orders",
      { params },
    );
    return response.data;
  },

  async respondToOrder(orderId: string, accept: boolean) {
    const response = await apiClient.post<ApiResponse<any>>(
      `/orders/restaurant/orders/${orderId}/respond`,
      { accept },
    );
    return response.data;
  },

  async updateOrderStatus(orderId: string, status: string) {
    const response = await apiClient.put<ApiResponse<any>>(
      `/orders/restaurant/orders/${orderId}/status`,
      { status },
    );
    return response.data;
  },

  // Rider
  async getAvailableOrders() {
    const response = await apiClient.get<ApiResponse<any>>(
      "/orders/rider/available",
    );
    return response.data;
  },

  async getMyOrders(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/orders/rider/my-orders",
      { params },
    );
    return response.data;
  },

  async acceptOrder(orderId: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      `/orders/${orderId}/accept`,
    );
    return response.data;
  },

  async rejectOrder(orderId: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      `/orders/${orderId}/reject`,
    );
    return response.data;
  },

  async updateLocation(
    orderId: string,
    location: { lat: number; lng: number },
  ) {
    const response = await apiClient.put<ApiResponse<any>>(
      `/orders/${orderId}/location`,
      location,
    );
    return response.data;
  },

  async confirmPickup(orderId: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      `/orders/${orderId}/confirm-pickup`,
    );
    return response.data;
  },

  async confirmDelivery(orderId: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      `/orders/${orderId}/confirm-delivery`,
    );
    return response.data;
  },

  async getCurrentOrder() {
    const response = await apiClient.get<ApiResponse<any>>(
      "/orders/rider/current",
    );
    return response.data;
  },

  async getHistory() {
    const response = await apiClient.get<ApiResponse<any>>(
      "/orders/rider/history",
    );
    return response.data;
  },

  // Admin
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    restaurantId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/admin/orders",
      { params },
    );
    return response.data;
  },

  async getByIdAdmin(id: string) {
    const response = await apiClient.get<ApiResponse<any>>(
      `/admin/orders/${id}`,
    );
    return response.data;
  },

  async update(id: string, data: { status?: string; riderId?: string }) {
    const response = await apiClient.put<ApiResponse<any>>(
      `/admin/orders/${id}`,
      data,
    );
    return response.data;
  },
};

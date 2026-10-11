import type { ApiResponse, PaginatedResponse } from "../../types";
import { apiClient } from "./client";

export const paymentsApi = {
  // User
  async createIntent(amount: number, currency: string, orderId: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      "/payments/create-intent",
      { amount, currency, orderId },
    );
    return response.data;
  },

  async confirm(paymentIntentId: string, paymentMethodId: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      "/payments/confirm",
      { paymentIntentId, paymentMethodId },
    );
    return response.data;
  },

  async getMethods() {
    const response =
      await apiClient.get<ApiResponse<any[]>>("/payments/methods");
    return response.data;
  },

  async addMethod(data: any) {
    const response = await apiClient.post<ApiResponse<any>>(
      "/payments/methods",
      data,
    );
    return response.data;
  },

  async removeMethod(methodId: string) {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/payments/methods/${methodId}`,
    );
    return response.data;
  },

  async getHistory(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/payments/history",
      { params },
    );
    return response.data;
  },

  // Admin/Restaurant
  async refund(orderId: string, amount: number, reason: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      "/payments/refund",
      { orderId, amount, reason },
    );
    return response.data;
  },

  // Admin
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/admin/payments",
      { params },
    );
    return response.data;
  },
};

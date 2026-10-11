import type { ApiResponse, PaginatedResponse } from "@/types";
import { apiClient } from "./client";

export const usersApi = {
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/admin/users",
      { params },
    );
    return response.data;
  },

  async getUser(id: string) {
    const response = await apiClient.get<ApiResponse<any>>(
      `/admin/users/${id}`,
    );
    return response.data;
  },

  async updateUserStatus(id: string, status: string) {
    const response = await apiClient.put<ApiResponse<any>>(
      `/admin/users/${id}/status`,
      { status },
    );
    return response.data;
  },

  async deleteUser(id: string) {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/admin/users/${id}`,
    );
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get<ApiResponse<any>>("/users/profile");
    return response.data;
  },

  async updateProfile(data: any) {
    const response = await apiClient.put<ApiResponse<any>>(
      "/users/profile",
      data,
    );
    return response.data;
  },

  async updatePreferences(data: any) {
    const response = await apiClient.put<ApiResponse<any>>(
      "/users/preferences",
      data,
    );
    return response.data;
  },

  async getAddresses() {
    const response = await apiClient.get<ApiResponse<any>>("/users/addresses");
    return response.data;
  },

  async addAddress(data: any) {
    const response = await apiClient.post<ApiResponse<any>>(
      "/users/addresses",
      data,
    );
    return response.data;
  },

  async updateAddress(id: string, data: any) {
    const response = await apiClient.put<ApiResponse<any>>(
      `/users/addresses/${id}`,
      data,
    );
    return response.data;
  },

  async deleteAddress(id: string) {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/users/addresses/${id}`,
    );
    return response.data;
  },

  async getOrders() {
    const response = await apiClient.get<ApiResponse<any>>("/users/orders");
    return response.data;
  },

  async getOrder(id: string) {
    const response = await apiClient.get<ApiResponse<any>>(
      `/users/orders/${id}`,
    );
    return response.data;
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await apiClient.post<ApiResponse<any>>(
      "/users/avatar",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },
};

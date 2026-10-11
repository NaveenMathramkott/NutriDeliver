import type { ApiResponse, PaginatedResponse } from "../../types";
import { apiClient } from "./client";

export const foodApi = {
  // Public
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    restaurantId?: string;
    category?: string;
  }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/food",
      { params },
    );
    return response.data;
  },

  async getCategories() {
    const response =
      await apiClient.get<ApiResponse<any[]>>("/food/categories");
    return response.data;
  },

  async search(params?: { q?: string; page?: number; limit?: number }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/food/search",
      { params },
    );
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get<ApiResponse<any>>(`/food/${id}`);
    return response.data;
  },

  async getByRestaurant(restaurantId: string) {
    const response = await apiClient.get<ApiResponse<any>>(
      `/food/restaurant/${restaurantId}`,
    );
    return response.data;
  },

  // Restaurant owner
  async create(data: FormData) {
    const response = await apiClient.post<ApiResponse<any>>("/food", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async update(id: string, data: FormData) {
    const response = await apiClient.put<ApiResponse<any>>(
      `/food/${id}`,
      data,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete<ApiResponse<any>>(`/food/${id}`);
    return response.data;
  },

  async toggleAvailability(id: string) {
    const response = await apiClient.patch<ApiResponse<any>>(
      `/food/${id}/availability`,
    );
    return response.data;
  },

  async uploadImages(id: string, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const response = await apiClient.post<ApiResponse<any>>(
      `/food/${id}/images`,
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
    category?: string;
    isAvailable?: boolean;
    restaurantId?: string;
  }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/admin/food",
      { params },
    );
    return response.data;
  },
};

import type { ApiResponse, Category, Pagination } from "../../types";
import { apiClient } from "./client";

export interface CategoriesResponse {
  categories: Category[];
  pagination: Pagination;
}

export const categoriesApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const response = await apiClient.get<ApiResponse<CategoriesResponse>>(
      "/admin/categories",
      { params },
    );
    return response.data;
  },

  async create(data: { name: string; description?: string; image?: string }) {
    const response = await apiClient.post<ApiResponse<{ category: Category }>>(
      "/admin/categories",
      data,
    );
    return response.data;
  },

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      image?: string;
      isActive?: boolean;
    },
  ) {
    const response = await apiClient.put<ApiResponse<{ category: Category }>>(
      `/admin/categories/${id}`,
      data,
    );
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete<ApiResponse<Record<string, never>>>(
      `/admin/categories/${id}`,
    );
    return response.data;
  },
};

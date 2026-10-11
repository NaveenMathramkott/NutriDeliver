import type { ApiResponse, PaginatedResponse } from "../../types";
import { apiClient } from "./client";

export const categoriesApi = {
  async getAll() {
    const response =
      await apiClient.get<ApiResponse<any[]>>("/admin/categories");
    return response.data;
  },

  async create(data: { name: string; description?: string; image?: string }) {
    const response = await apiClient.post<ApiResponse<any>>(
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
    const response = await apiClient.put<ApiResponse<any>>(
      `/admin/categories/${id}`,
      data,
    );
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/admin/categories/${id}`,
    );
    return response.data;
  },
};

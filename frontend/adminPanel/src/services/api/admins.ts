import type { ApiResponse, PaginatedResponse } from "@/types";
import { apiClient } from "./client";

export const adminsApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/admin/admins",
      { params },
    );
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get<ApiResponse<any>>(
      `/admin/admins/${id}`,
    );
    return response.data;
  },

  async create(data: {
    email: string;
    name: string;
    role: string;
    permissions: string[];
  }) {
    const response = await apiClient.post<ApiResponse<any>>(
      "/admin/admins",
      data,
    );
    return response.data;
  },

  async update(
    id: string,
    data: { name?: string; role?: string; permissions?: string[] },
  ) {
    const response = await apiClient.put<ApiResponse<any>>(
      `/admin/admins/${id}`,
      data,
    );
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/admin/admins/${id}`,
    );
    return response.data;
  },
};

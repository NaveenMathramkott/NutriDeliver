import type { ApiResponse, PaginatedResponse } from "../../types";
import { apiClient } from "./client";

export const offersApi = {
  // Public
  async getActive() {
    const response = await apiClient.get<ApiResponse<any[]>>("/offers");
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get<ApiResponse<any>>(`/offers/${id}`);
    return response.data;
  },

  async validate(code: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      "/offers/validate",
      { code },
    );
    return response.data;
  },

  // Admin
  async getAll(params?: { page?: number; limit?: number; isActive?: boolean }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/admin/offers",
      { params },
    );
    return response.data;
  },

  async create(data: any) {
    const response = await apiClient.post<ApiResponse<any>>(
      "/admin/offers",
      data,
    );
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await apiClient.put<ApiResponse<any>>(
      `/admin/offers/${id}`,
      data,
    );
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/admin/offers/${id}`,
    );
    return response.data;
  },
};

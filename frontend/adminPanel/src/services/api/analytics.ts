import type { ApiResponse, PaginatedResponse } from "../../types";
import { apiClient } from "./client";

export const analyticsApi = {
  async getPlatform() {
    const response = await apiClient.get<ApiResponse<any>>(
      "/admin/analytics/platform",
    );
    return response.data;
  },

  async getSales(params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: "day" | "week" | "month";
  }) {
    const response = await apiClient.get<ApiResponse<any>>(
      "/admin/analytics/sales",
      { params },
    );
    return response.data;
  },

  async getUsers(params?: { startDate?: string; endDate?: string }) {
    const response = await apiClient.get<ApiResponse<any>>(
      "/admin/analytics/users",
      { params },
    );
    return response.data;
  },
};

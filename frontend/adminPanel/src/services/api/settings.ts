import type { ApiResponse, PaginatedResponse } from "../../types";
import { apiClient } from "./client";

export const settingsApi = {
  async get() {
    const response = await apiClient.get<ApiResponse<any>>("/admin/settings");
    return response.data;
  },

  async update(data: any) {
    const response = await apiClient.put<ApiResponse<any>>(
      "/admin/settings",
      data,
    );
    return response.data;
  },
};

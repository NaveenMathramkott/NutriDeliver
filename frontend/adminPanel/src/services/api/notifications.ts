import type { ApiResponse, PaginatedResponse } from "../../types";
import { apiClient } from "./client";

export const notificationsApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
  }) {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      "/notifications",
      { params },
    );
    return response.data;
  },

  async getUnreadCount() {
    const response = await apiClient.get<ApiResponse<{ unreadCount: number }>>(
      "/notifications/unread-count",
    );
    return response.data;
  },

  async markAsRead(id: string) {
    const response = await apiClient.put<ApiResponse<any>>(
      `/notifications/${id}/read`,
    );
    return response.data;
  },

  async markAllAsRead() {
    const response = await apiClient.put<ApiResponse<any>>(
      "/notifications/read-all",
    );
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/notifications/${id}`,
    );
    return response.data;
  },

  async updatePreferences(data: any) {
    const response = await apiClient.put<ApiResponse<any>>(
      "/notifications/preferences",
      data,
    );
    return response.data;
  },
};

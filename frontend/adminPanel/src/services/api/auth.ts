import type { ApiResponse } from "@/types";
import { apiClient } from "./client";

export const authApi = {
  async login(email: string, password: string) {
    const response = await apiClient.post<
      ApiResponse<{ token: string; user: any }>
    >("/auth/login", { email, password });
    return response.data;
  },

  async getMe() {
    const response = await apiClient.get<ApiResponse<any>>("/auth/me");
    return response.data;
  },

  async logout() {
    const response = await apiClient.post<ApiResponse<any>>("/auth/logout");
    return response.data;
  },

  async refreshToken() {
    const response = await apiClient.post<ApiResponse<any>>(
      "/auth/refresh-token",
    );
    return response.data;
  },

  async register(data: { email: string; password: string; name: string }) {
    const response = await apiClient.post<
      ApiResponse<{ token: string; user: any }>
    >("/auth/register", data);
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      "/auth/forgot-password",
      { email },
    );
    return response.data;
  },

  async verifyResetOtp(email: string, otp: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      "/auth/verify-reset-otp",
      { email, otp },
    );
    return response.data;
  },

  async resetPassword(email: string, otp: string, password: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      "/auth/reset-password",
      { email, otp, password },
    );
    return response.data;
  },

  async verifyEmail(email: string, otp: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      "/auth/verify-email",
      { email, otp },
    );
    return response.data;
  },

  async resendVerification(email: string) {
    const response = await apiClient.post<ApiResponse<any>>(
      "/auth/resend-verification",
      { email },
    );
    return response.data;
  },
};

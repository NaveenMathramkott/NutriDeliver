import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosError,
} from "axios";
import { clearToken, getToken } from "@/services/tokenStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

type UnauthorizedHandler = () => void;

/**
 * Registered by the app so a 401 clears Redux state and redirects through the
 * router, instead of a hard navigation that bypasses the store entirely.
 */
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // The login endpoint returning 401 is a bad-credentials error, not an
        // expired session — don't tear down the app for it.
        const isLoginRequest = error.config?.url?.includes("/auth/login");

        if (error.response?.status === 401 && !isLoginRequest) {
          clearToken();
          onUnauthorized?.();
        }
        return Promise.reject(error);
      },
    );
  }

  get<T>(url: string, config?: any) {
    return this.client.get<T>(url, config);
  }

  post<T>(url: string, data?: any, config?: any) {
    return this.client.post<T>(url, data, config);
  }

  put<T>(url: string, data?: any, config?: any) {
    return this.client.put<T>(url, data, config);
  }

  patch<T>(url: string, data?: any, config?: any) {
    return this.client.patch<T>(url, data, config);
  }

  delete<T>(url: string, config?: any) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();

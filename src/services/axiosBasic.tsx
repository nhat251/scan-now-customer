import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import defaultAxios from "axios";

import { getStoredAccessToken } from "@/lib/auth";
import { getTenantSlug } from "@/lib/tenant";
import { login, logout } from "@/stores/user";
import type { ApiResponse } from "@/types/api";
import type { AuthPayload } from "@/types/auth";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

type ExtendedAxiosRequestConfig = AxiosRequestConfig & {
  skipAuthRefresh?: boolean;
};

let refreshPromise: Promise<AuthPayload | null> | null = null;

const clearAuthState = () => {
  logout();
};

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = defaultAxios
      .post<ApiResponse<AuthPayload>>("/api/auth/refresh-token", undefined, {
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
      })
      .then((response) => {
        const payload = response.data.result;

        if (!payload) {
          clearAuthState();
          return null;
        }

        login(payload);

        return payload;
      })
      .catch((error) => {
        clearAuthState();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const axiosBasic = defaultAxios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "*/*",
  },
});

axiosBasic.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();

    config.withCredentials = true;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }

    // Tell the backend which tenant this request belongs to.
    // The backend TenantResolutionMiddleware reads this header to scope
    // all EF Core queries to the correct Restaurant (tenant).
    const tenantSlug = getTenantSlug();
    if (tenantSlug) {
      config.headers["X-Tenant-Slug"] = tenantSlug;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosBasic.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (
      !originalRequest ||
      status !== 401 ||
      originalRequest._retry ||
      originalRequest.skipAuthRefresh ||
      !getStoredAccessToken()
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const payload = await refreshAccessToken();

      if (!payload?.accessToken) {
        clearAuthState();
        return Promise.reject(error);
      }

      originalRequest.headers.Authorization = `Bearer ${payload.accessToken}`;
      originalRequest.withCredentials = true;

      return axiosBasic(originalRequest);
    } catch (refreshError) {
      clearAuthState();
      return Promise.reject(refreshError);
    }
  }
);

export const withAuthRequestConfig = (
  config: ExtendedAxiosRequestConfig = {}
): ExtendedAxiosRequestConfig => ({
  withCredentials: true,
  ...config,
});

export const withAuthRefreshSkipped = (
  config: ExtendedAxiosRequestConfig = {}
): ExtendedAxiosRequestConfig => ({
  ...withAuthRequestConfig(config),
  skipAuthRefresh: true,
});

export type { ExtendedAxiosRequestConfig };

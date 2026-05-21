import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import defaultAxios from "axios";

import { getStoredAccessToken } from "@/lib/auth";
import { logout, setAccessToken, setUser } from "@/stores/user";
import type { ApiResponse } from "@/types/api";
import type { AuthPayload } from "@/types/auth";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

const clearAuthState = () => {
  setUser(null);
  logout();
};

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = defaultAxios
      .post<ApiResponse<AuthPayload>>(
        "/api/auth/refresh-token",
        {},
        {
          baseURL: process.env.NEXT_PUBLIC_API_URL,
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
          },
        }
      )
      .then((response) => {
        const accessToken = response.data.result.accessToken;

        setAccessToken(accessToken);
        setUser(response.data.result.user);

        return accessToken;
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

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.withCredentials = true;

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

    if (!originalRequest || status !== 401 || originalRequest._retry || originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken = await refreshAccessToken();

      if (!accessToken) {
        clearAuthState();
        return Promise.reject(error);
      }

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return axiosBasic(originalRequest);
    } catch (refreshError) {
      clearAuthState();
      return Promise.reject(refreshError);
    }
  }
);

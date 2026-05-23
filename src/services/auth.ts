import { axiosBasic, withAuthRefreshSkipped } from "@/services/axiosBasic";
import type { ApiResponse } from "@/types/api";
import type { AuthPayload, LoginRequest } from "@/types/auth";

export const loginRequest = async (payload: LoginRequest): Promise<ApiResponse<AuthPayload>> => {
  const response = await axiosBasic.post<ApiResponse<AuthPayload>>(
    "/api/auth/login",
    payload,
    withAuthRefreshSkipped()
  );

  return response.data;
};

export const refreshTokenRequest = async (): Promise<ApiResponse<AuthPayload>> => {
  const response = await axiosBasic.post<ApiResponse<AuthPayload>>(
    "/api/auth/refresh-token",
    undefined,
    withAuthRefreshSkipped()
  );

  return response.data;
};

export const logoutRequest = async (): Promise<ApiResponse<null>> => {
  const response = await axiosBasic.post<ApiResponse<null>>(
    "/api/auth/logout",
    {},
    withAuthRefreshSkipped()
  );

  return response.data;
};

export const hasRefreshCookieRequest = async () => {
  try {
    await refreshTokenRequest();
    return true;
  } catch {
    return false;
  }
};

export type AuthRequestConfig = {
  skipAuthRefresh?: boolean;
};

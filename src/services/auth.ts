import { axiosBasic } from "@/services/axiosBasic";
import type { ApiResponse } from "@/types/api";
import type { AuthPayload, LoginRequest } from "@/types/auth";

export const loginRequest = async (payload: LoginRequest) => {
  const response = await axiosBasic.post<ApiResponse<AuthPayload>>("/api/auth/login", payload);

  return response.data;
};

export const refreshTokenRequest = async () => {
  const response = await axiosBasic.post<ApiResponse<AuthPayload>>("/api/auth/refresh-token");

  return response.data;
};

export const logoutRequest = async () => {
  const response = await axiosBasic.post<ApiResponse<null>>("/api/auth/logout");

  return response.data;
};

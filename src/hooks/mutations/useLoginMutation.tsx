import { isAxiosError } from "axios";

import useMutation from "@/hooks/useMutation";
import { getRoleRedirectPath } from "@/lib/auth";
import { loginRequest } from "@/services/auth";
import { login } from "@/stores/user";
import type { ApiResponse } from "@/types/api";
import type { AuthPayload, LoginRequest } from "@/types/auth";

export const getLoginErrorMessage = (error: unknown) => {
  if (!isAxiosError<ApiResponse<null>>(error)) {
    return "Unable to sign in right now. Please try again.";
  }

  const status = error.response?.status;
  const message = error.response?.data?.message;

  if (status === 401) {
    return "Invalid username, email, or password.";
  }

  if (message?.toLowerCase().includes("verify")) {
    return message;
  }

  if (message?.toLowerCase().includes("inactive")) {
    return message;
  }

  return message || "Unable to sign in right now. Please try again.";
};

export const useLoginMutation = () => {
  return useMutation<LoginRequest, ApiResponse<AuthPayload>>({
    mutationFn: loginRequest,
    hasLoading: true,
    onSuccess: (response) => {
      login(response.result);
    },
  });
};

export const getLoginRedirectPath = (payload: AuthPayload) => {
  return getRoleRedirectPath(payload.user?.role);
};

export const getLoginRedirectPathFromRole = (role?: string | null) => {
  return getRoleRedirectPath(role);
};

export const mapLoginErrorMessage = getLoginErrorMessage;

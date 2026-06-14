import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import useMutation from "@/hooks/useMutation";
import { getRoleRedirectPath } from "@/lib/auth";
import { loginRequest } from "@/services/auth";
import { login } from "@/stores/user";
import type { ApiResponse } from "@/types/api";
import type { AuthPayload, LoginRequest } from "@/types/auth";

export const getLoginErrorMessage = (error: unknown) => {
  return getVietnameseApiErrorMessage(error, "Hiện không thể đăng nhập. Vui lòng thử lại.");
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

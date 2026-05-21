import useMutation from "@/hooks/useMutation";
import { logoutRequest } from "@/services/auth";
import { logout } from "@/stores/user";
import type { ApiResponse } from "@/types/api";

export const useLogoutMutation = () => {
  return useMutation<void, ApiResponse<null>>({
    mutationFn: logoutRequest,
    hasLoading: true,
    onSuccess: () => {
      logout();
    },
  });
};

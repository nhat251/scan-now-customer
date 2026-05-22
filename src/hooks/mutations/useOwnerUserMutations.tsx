import defaultAxios from "axios";

import { QUERY_KEY } from "@/constants/queryKeys";
import useMutation from "@/hooks/useMutation";
import { axiosBasic } from "@/services/axiosBasic";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type {
  CreateManagedUserRequest,
  OwnerScopedUserResponse,
  UpdateManagedUserRequest,
} from "@/types/user-management";
import { useQueryClient } from "@tanstack/react-query";

type UpdateOwnerUserPayload = {
  id: string;
  data: UpdateManagedUserRequest;
};

type ToggleOwnerUserPayload = {
  id: string;
};

const createOwnerUser = async (payload: CreateManagedUserRequest) => {
  return await axiosBasic.post<ApiResponse<OwnerScopedUserResponse>>("/api/owner/users", payload);
};

const updateOwnerUser = async ({ id, data }: UpdateOwnerUserPayload) => {
  return await axiosBasic.put<ApiResponse<OwnerScopedUserResponse>>(`/api/owner/users/${id}`, data);
};

const banOwnerUser = async ({ id }: ToggleOwnerUserPayload) => {
  return await axiosBasic.patch<ApiResponse<null>>(`/api/owner/users/${id}/ban`);
};

const unbanOwnerUser = async ({ id }: ToggleOwnerUserPayload) => {
  return await axiosBasic.patch<ApiResponse<null>>(`/api/owner/users/${id}/unban`);
};

const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (defaultAxios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallbackMessage;
  }

  return fallbackMessage;
};

const useOwnerUserMutationHelpers = () => {
  const queryClient = useQueryClient();

  const refreshOwnerUsers = async (successMessage: string) => {
    try {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.OWNER_USERS] });
      await queryClient.refetchQueries({ queryKey: [QUERY_KEY.OWNER_USERS], type: "active" });
      showNotify({ type: "success", message: successMessage });
    } catch {
      showNotify({
        type: "warning",
        message: "The change was saved, but we could not refresh the user list. Please refresh the page.",
      });
    }
  };

  return { refreshOwnerUsers };
};

export const useCreateOwnerUserMutation = () => {
  const { refreshOwnerUsers } = useOwnerUserMutationHelpers();

  return useMutation<CreateManagedUserRequest, ApiResponse<OwnerScopedUserResponse>>({
    mutationFn: createOwnerUser,
    hasLoading: true,
    onSuccess: async () => {
      await refreshOwnerUsers("User created successfully.");
    },
    onError: (error) => {
      showNotify({ type: "error", message: getApiErrorMessage(error, "Unable to create this user.") });
    },
  });
};

export const useUpdateOwnerUserMutation = () => {
  const { refreshOwnerUsers } = useOwnerUserMutationHelpers();

  return useMutation<UpdateOwnerUserPayload, ApiResponse<OwnerScopedUserResponse>>({
    mutationFn: updateOwnerUser,
    hasLoading: true,
    onSuccess: async () => {
      await refreshOwnerUsers("User updated successfully.");
    },
    onError: (error) => {
      showNotify({ type: "error", message: getApiErrorMessage(error, "Unable to update this user.") });
    },
  });
};

export const useBanOwnerUserMutation = () => {
  const { refreshOwnerUsers } = useOwnerUserMutationHelpers();

  return useMutation<ToggleOwnerUserPayload, ApiResponse<null>>({
    mutationFn: banOwnerUser,
    hasLoading: true,
    onSuccess: async () => {
      await refreshOwnerUsers("User banned successfully.");
    },
    onError: (error) => {
      showNotify({ type: "error", message: getApiErrorMessage(error, "Unable to ban this user.") });
    },
  });
};

export const useUnbanOwnerUserMutation = () => {
  const { refreshOwnerUsers } = useOwnerUserMutationHelpers();

  return useMutation<ToggleOwnerUserPayload, ApiResponse<null>>({
    mutationFn: unbanOwnerUser,
    hasLoading: true,
    onSuccess: async () => {
      await refreshOwnerUsers("User unbanned successfully.");
    },
    onError: (error) => {
      showNotify({ type: "error", message: getApiErrorMessage(error, "Unable to unban this user.") });
    },
  });
};

import defaultAxios from "axios";

import { QUERY_KEY } from "@/constants/queryKeys";
import useMutation from "@/hooks/useMutation";
import { axiosBasic } from "@/services/axiosBasic";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type {
  BranchResponse,
  CreateBranchRequest,
  UpdateBranchRequest,
} from "@/types/user-management";
import { useQueryClient } from "@tanstack/react-query";

type UpdateOwnerBranchPayload = {
  id: string;
  data: UpdateBranchRequest;
};

type ToggleOwnerBranchPayload = {
  id: string;
};

const createOwnerBranch = async (payload: CreateBranchRequest) => {
  return await axiosBasic.post<ApiResponse<BranchResponse>>("/api/owner/branches", payload);
};

const updateOwnerBranch = async ({ id, data }: UpdateOwnerBranchPayload) => {
  return await axiosBasic.put<ApiResponse<BranchResponse>>(`/api/owner/branches/${id}`, data);
};

const activateOwnerBranch = async ({ id }: ToggleOwnerBranchPayload) => {
  return await axiosBasic.patch<ApiResponse<BranchResponse>>(`/api/owner/branches/${id}/active`);
};

const inactivateOwnerBranch = async ({ id }: ToggleOwnerBranchPayload) => {
  return await axiosBasic.patch<ApiResponse<BranchResponse>>(`/api/owner/branches/${id}/inactive`);
};

const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (defaultAxios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallbackMessage;
  }

  return fallbackMessage;
};

const useOwnerBranchMutationHelpers = () => {
  const queryClient = useQueryClient();

  const refreshOwnerBranches = async (successMessage: string) => {
    try {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.OWNER_BRANCHES] });
      await queryClient.refetchQueries({ queryKey: [QUERY_KEY.OWNER_BRANCHES], type: "active" });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.OWNER_RESTAURANT] });
      showNotify({ type: "success", message: successMessage });
    } catch {
      showNotify({
        type: "warning",
        message:
          "The change was saved, but we could not refresh the branch data. Please refresh the page.",
      });
    }
  };

  return { refreshOwnerBranches };
};

export const useCreateOwnerBranchMutation = () => {
  const { refreshOwnerBranches } = useOwnerBranchMutationHelpers();

  return useMutation<CreateBranchRequest, ApiResponse<BranchResponse>>({
    mutationFn: createOwnerBranch,
    hasLoading: true,
    onSuccess: async () => {
      await refreshOwnerBranches("Branch created successfully.");
    },
    onError: (error) => {
      showNotify({
        type: "error",
        message: getApiErrorMessage(error, "Unable to create this branch."),
      });
    },
  });
};

export const useUpdateOwnerBranchMutation = () => {
  const { refreshOwnerBranches } = useOwnerBranchMutationHelpers();

  return useMutation<UpdateOwnerBranchPayload, ApiResponse<BranchResponse>>({
    mutationFn: updateOwnerBranch,
    hasLoading: true,
    onSuccess: async () => {
      await refreshOwnerBranches("Branch updated successfully.");
    },
    onError: (error) => {
      showNotify({
        type: "error",
        message: getApiErrorMessage(error, "Unable to update this branch."),
      });
    },
  });
};

export const useActivateOwnerBranchMutation = () => {
  const { refreshOwnerBranches } = useOwnerBranchMutationHelpers();

  return useMutation<ToggleOwnerBranchPayload, ApiResponse<BranchResponse>>({
    mutationFn: activateOwnerBranch,
    hasLoading: true,
    onSuccess: async () => {
      await refreshOwnerBranches("Branch activated successfully.");
    },
    onError: (error) => {
      showNotify({
        type: "error",
        message: getApiErrorMessage(error, "Unable to activate this branch."),
      });
    },
  });
};

export const useInactivateOwnerBranchMutation = () => {
  const { refreshOwnerBranches } = useOwnerBranchMutationHelpers();

  return useMutation<ToggleOwnerBranchPayload, ApiResponse<BranchResponse>>({
    mutationFn: inactivateOwnerBranch,
    hasLoading: true,
    onSuccess: async () => {
      await refreshOwnerBranches("Branch deactivated successfully.");
    },
    onError: (error) => {
      showNotify({
        type: "error",
        message: getApiErrorMessage(error, "Unable to deactivate this branch."),
      });
    },
  });
};

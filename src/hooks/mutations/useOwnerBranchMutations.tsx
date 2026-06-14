import { QUERY_KEY } from "@/constants/queryKeys";
import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
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
          "Đã lưu thay đổi nhưng chưa thể tải lại dữ liệu chi nhánh. Vui lòng tải lại trang.",
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
      await refreshOwnerBranches("Đã tạo chi nhánh.");
    },
    onError: (error) => {
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể tạo chi nhánh."),
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
      await refreshOwnerBranches("Đã cập nhật chi nhánh.");
    },
    onError: (error) => {
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể cập nhật chi nhánh."),
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
      await refreshOwnerBranches("Đã kích hoạt chi nhánh.");
    },
    onError: (error) => {
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể kích hoạt chi nhánh."),
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
      await refreshOwnerBranches("Đã ngừng hoạt động chi nhánh.");
    },
    onError: (error) => {
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể ngừng hoạt động chi nhánh."),
      });
    },
  });
};

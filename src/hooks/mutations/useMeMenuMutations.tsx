import { QUERY_KEY } from "@/constants/queryKeys";
import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import useMutation from "@/hooks/useMutation";
import { bulkUpdateMyMenuAvailability, toggleMyMenuItemAvailable } from "@/services/me";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type { BulkAvailabilityRequest, MyMenuItemResponse } from "@/types/me";
import { useQueryClient } from "@tanstack/react-query";

type BulkAvailabilityPayload = {
  branchId: string;
  request: BulkAvailabilityRequest;
};

export const useToggleMyMenuItemAvailabilityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<string, ApiResponse<MyMenuItemResponse>>({
    mutationFn: async (menuItemId) => {
      const response = await toggleMyMenuItemAvailable(menuItemId);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.MY_BRANCH_MENU] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.MY_MENU_ITEM] });
      showNotify({ type: "success", message: "Đã cập nhật tình trạng phục vụ." });
    },
    onError: (error) => {
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(
          error,
          "Không thể cập nhật tình trạng phục vụ của món."
        ),
      });
    },
  });
};

export const useBulkMyMenuAvailabilityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkAvailabilityPayload, ApiResponse<MyMenuItemResponse[]>>({
    mutationFn: async (payload) => {
      const response = await bulkUpdateMyMenuAvailability(payload);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.MY_BRANCH_MENU] });
      showNotify({ type: "success", message: "Đã cập nhật các món đã chọn." });
    },
    onError: (error) => {
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể cập nhật các món đã chọn."),
      });
    },
  });
};

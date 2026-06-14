import { QUERY_KEY } from "@/constants/queryKeys";
import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import useMutation from "@/hooks/useMutation";
import { axiosBasic } from "@/services/axiosBasic";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type { RestaurantResponse, UpdateRestaurantRequest } from "@/types/user-management";
import { useQueryClient } from "@tanstack/react-query";

const updateOwnerRestaurant = async (payload: UpdateRestaurantRequest) => {
  return await axiosBasic.put<ApiResponse<RestaurantResponse>>("/api/owner/restaurant/me", payload);
};

const useOwnerRestaurantMutationHelpers = () => {
  const queryClient = useQueryClient();

  const refreshOwnerRestaurant = async (successMessage: string) => {
    try {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.OWNER_RESTAURANT] });
      await queryClient.refetchQueries({ queryKey: [QUERY_KEY.OWNER_RESTAURANT], type: "active" });
      showNotify({ type: "success", message: successMessage });
    } catch {
      showNotify({
        type: "warning",
        message:
          "Đã cập nhật nhà hàng nhưng chưa thể tải dữ liệu mới nhất. Vui lòng tải lại trang.",
      });
    }
  };

  return { refreshOwnerRestaurant };
};

export const useUpdateOwnerRestaurantMutation = () => {
  const { refreshOwnerRestaurant } = useOwnerRestaurantMutationHelpers();

  return useMutation<UpdateRestaurantRequest, ApiResponse<RestaurantResponse>>({
    mutationFn: updateOwnerRestaurant,
    hasLoading: true,
    onSuccess: async () => {
      await refreshOwnerRestaurant("Đã cập nhật nhà hàng.");
    },
    onError: (error) => {
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể cập nhật nhà hàng."),
      });
    },
  });
};

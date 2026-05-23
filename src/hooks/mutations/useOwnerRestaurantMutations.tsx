import defaultAxios from "axios";

import { QUERY_KEY } from "@/constants/queryKeys";
import useMutation from "@/hooks/useMutation";
import { axiosBasic } from "@/services/axiosBasic";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type { RestaurantResponse, UpdateRestaurantRequest } from "@/types/user-management";
import { useQueryClient } from "@tanstack/react-query";

const updateOwnerRestaurant = async (payload: UpdateRestaurantRequest) => {
  return await axiosBasic.put<ApiResponse<RestaurantResponse>>("/api/owner/restaurant/me", payload);
};

const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (defaultAxios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallbackMessage;
  }

  return fallbackMessage;
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
        message: "The restaurant was updated, but we could not refresh the latest details. Please refresh the page.",
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
      await refreshOwnerRestaurant("Restaurant updated successfully.");
    },
    onError: (error) => {
      showNotify({ type: "error", message: getApiErrorMessage(error, "Unable to update this restaurant.") });
    },
  });
};

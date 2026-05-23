import defaultAxios from "axios";

import { QUERY_KEY } from "@/constants/queryKeys";
import useQuery from "@/hooks/useQuery";
import { axiosBasic } from "@/services/axiosBasic";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type { RestaurantResponse } from "@/types/user-management";

const getOwnerRestaurant = async () => {
  return await axiosBasic.get<ApiResponse<RestaurantResponse>>("/api/owner/restaurant/me");
};

const getOwnerRestaurantErrorMessage = (error: unknown) => {
  if (defaultAxios.isAxiosError(error)) {
    return error.response?.data?.message ?? "Unable to load restaurant details.";
  }

  return "Unable to load restaurant details.";
};

export const useOwnerRestaurantQuery = () => {
  return useQuery<ApiResponse<RestaurantResponse>, RestaurantResponse>({
    queryKey: [QUERY_KEY.OWNER_RESTAURANT],
    queryFn: getOwnerRestaurant,
    select: (res) => res.data.result,
    onError: (error) => {
      showNotify({ type: "error", message: getOwnerRestaurantErrorMessage(error) });
    },
  });
};

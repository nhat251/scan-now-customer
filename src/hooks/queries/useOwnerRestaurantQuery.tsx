import { QUERY_KEY } from "@/constants/queryKeys";
import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import useQuery from "@/hooks/useQuery";
import { axiosBasic } from "@/services/axiosBasic";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type { RestaurantResponse } from "@/types/user-management";

const getOwnerRestaurant = async () => {
  return await axiosBasic.get<ApiResponse<RestaurantResponse>>("/api/owner/restaurant/me");
};

export const useOwnerRestaurantQuery = () => {
  return useQuery<ApiResponse<RestaurantResponse>, RestaurantResponse>({
    queryKey: [QUERY_KEY.OWNER_RESTAURANT],
    queryFn: getOwnerRestaurant,
    select: (res) => res.data.result,
    onError: (error) => {
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể tải thông tin nhà hàng."),
      });
    },
  });
};

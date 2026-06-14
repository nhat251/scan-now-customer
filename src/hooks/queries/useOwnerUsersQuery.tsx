import { QUERY_KEY } from "@/constants/queryKeys";
import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import useQuery from "@/hooks/useQuery";
import { axiosBasic } from "@/services/axiosBasic";
import { showNotify } from "@/stores/global";
import type { ApiResponse, PagedResult } from "@/types/api";
import type { OwnerScopedUserResponse, UserListQuery } from "@/types/user-management";

const getOwnerUsers = async (query: UserListQuery) => {
  return await axiosBasic.get<ApiResponse<PagedResult<OwnerScopedUserResponse>>>(
    "/api/owner/users",
    {
      params: query,
    }
  );
};

export const useOwnerUsersQuery = (query: UserListQuery) => {
  return useQuery<
    ApiResponse<PagedResult<OwnerScopedUserResponse>>,
    PagedResult<OwnerScopedUserResponse>
  >({
    queryKey: [
      QUERY_KEY.OWNER_USERS,
      String(query.pageNumber),
      String(query.pageSize),
      query.search ?? "",
      query.role ?? "",
      query.branchId ?? "",
      query.isActive === undefined ? "" : String(query.isActive),
      query.isBanned === undefined ? "" : String(query.isBanned),
      query.sortBy ?? "",
      query.sortDirection ?? "",
    ],
    queryFn: () => getOwnerUsers(query),
    select: (res) => res.data.result,
    onError: (error) => {
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể tải danh sách nhân sự."),
      });
    },
  });
};

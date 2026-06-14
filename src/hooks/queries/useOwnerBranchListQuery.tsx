import { QUERY_KEY } from "@/constants/queryKeys";
import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import useQuery from "@/hooks/useQuery";
import { axiosBasic } from "@/services/axiosBasic";
import { showNotify } from "@/stores/global";
import type { ApiResponse, PagedResult } from "@/types/api";
import type { BranchResponse, OwnerBranchListQuery } from "@/types/user-management";

const getOwnerBranchList = async (query: OwnerBranchListQuery) => {
  return await axiosBasic.get<ApiResponse<PagedResult<BranchResponse>>>("/api/owner/branches", {
    params: query,
  });
};

export const useOwnerBranchListQuery = (query: OwnerBranchListQuery, enabled = true) => {
  return useQuery<ApiResponse<PagedResult<BranchResponse>>, PagedResult<BranchResponse>>({
    queryKey: [
      QUERY_KEY.OWNER_BRANCHES,
      String(query.pageNumber),
      String(query.pageSize),
      query.search ?? "",
      query.isActive === undefined ? "" : String(query.isActive),
      query.sortBy ?? "",
      query.sortDirection ?? "",
    ],
    queryFn: () => getOwnerBranchList(query),
    select: (res) => res.data.result,
    enabled,
    onError: (error) => {
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể tải danh sách chi nhánh."),
      });
    },
  });
};

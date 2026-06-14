import { QUERY_KEY } from "@/constants/queryKeys";
import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import useQuery from "@/hooks/useQuery";
import { axiosBasic } from "@/services/axiosBasic";
import { showNotify } from "@/stores/global";
import type { ApiResponse, PagedResult } from "@/types/api";
import type { BranchResponse } from "@/types/user-management";

const getOwnerBranches = async () => {
  return await axiosBasic.get<ApiResponse<PagedResult<BranchResponse>>>("/api/owner/branches", {
    params: {
      pageNumber: 1,
      pageSize: 100,
      sortBy: "name",
      sortDirection: "asc",
    },
  });
};

export const useOwnerBranchesQuery = () => {
  return useQuery<ApiResponse<PagedResult<BranchResponse>>, BranchResponse[]>({
    queryKey: [QUERY_KEY.OWNER_BRANCHES],
    queryFn: getOwnerBranches,
    select: (res) => res.data.result.items,
    onError: (error) => {
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể tải danh sách chi nhánh nhà hàng."),
      });
    },
  });
};

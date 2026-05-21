import defaultAxios from "axios";

import { QUERY_KEY } from "@/constants/queryKeys";
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

const getOwnerBranchesErrorMessage = (error: unknown) => {
  if (defaultAxios.isAxiosError(error)) {
    return error.response?.data?.message ?? "Unable to load restaurant branches.";
  }

  return "Unable to load restaurant branches.";
};

export const useOwnerBranchesQuery = () => {
  return useQuery<ApiResponse<PagedResult<BranchResponse>>, BranchResponse[]>({
    queryKey: [QUERY_KEY.OWNER_BRANCHES],
    queryFn: getOwnerBranches,
    select: (res) => res.data.result.items,
    onError: (error) => {
      showNotify({ type: "error", message: getOwnerBranchesErrorMessage(error) });
    },
  });
};

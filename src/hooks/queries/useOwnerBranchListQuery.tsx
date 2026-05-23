import defaultAxios from "axios";

import { QUERY_KEY } from "@/constants/queryKeys";
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

const getOwnerBranchListErrorMessage = (error: unknown) => {
  if (defaultAxios.isAxiosError(error)) {
    return error.response?.data?.message ?? "Unable to load branches.";
  }

  return "Unable to load branches.";
};

export const useOwnerBranchListQuery = (query: OwnerBranchListQuery) => {
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
    onError: (error) => {
      showNotify({ type: "error", message: getOwnerBranchListErrorMessage(error) });
    },
  });
};

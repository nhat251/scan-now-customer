import defaultAxios from "axios";

import { QUERY_KEY } from "@/constants/queryKeys";
import useQuery from "@/hooks/useQuery";
import { axiosBasic } from "@/services/axiosBasic";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type { BranchResponse } from "@/types/user-management";

const getOwnerBranchDetail = async (id: string) => {
  return await axiosBasic.get<ApiResponse<BranchResponse>>(`/api/owner/branches/${id}`);
};

const getOwnerBranchDetailErrorMessage = (error: unknown) => {
  if (defaultAxios.isAxiosError(error)) {
    return error.response?.data?.message ?? "Unable to load branch details.";
  }

  return "Unable to load branch details.";
};

export const useOwnerBranchDetailQuery = (id?: string) => {
  return useQuery<ApiResponse<BranchResponse>, BranchResponse>({
    queryKey: [QUERY_KEY.OWNER_BRANCH, id ?? ""],
    queryFn: () => getOwnerBranchDetail(id ?? ""),
    select: (res) => res.data.result,
    enabled: Boolean(id),
    onError: (error) => {
      showNotify({ type: "error", message: getOwnerBranchDetailErrorMessage(error) });
    },
  });
};

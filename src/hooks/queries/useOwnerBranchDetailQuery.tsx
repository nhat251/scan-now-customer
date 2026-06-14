import { QUERY_KEY } from "@/constants/queryKeys";
import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import useQuery from "@/hooks/useQuery";
import { axiosBasic } from "@/services/axiosBasic";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type { BranchResponse } from "@/types/user-management";

const getOwnerBranchDetail = async (id: string) => {
  return await axiosBasic.get<ApiResponse<BranchResponse>>(`/api/owner/branches/${id}`);
};

export const useOwnerBranchDetailQuery = (id?: string) => {
  return useQuery<ApiResponse<BranchResponse>, BranchResponse>({
    queryKey: [QUERY_KEY.OWNER_BRANCH, id ?? ""],
    queryFn: () => getOwnerBranchDetail(id ?? ""),
    select: (res) => res.data.result,
    enabled: Boolean(id),
    onError: (error) => {
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể tải chi tiết chi nhánh."),
      });
    },
  });
};

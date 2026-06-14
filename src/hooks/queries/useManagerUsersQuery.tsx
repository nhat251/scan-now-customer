import { QUERY_KEY } from "@/constants/queryKeys";
import useQuery from "@/hooks/useQuery";
import { axiosBasic } from "@/services/axiosBasic";
import type { ApiResponse, PagedResult } from "@/types/commons";
import type {
  BranchResponse,
  ManagerScopedUserResponse,
  UserListQuery,
} from "@/types/user-management";

const getManagerUsers = async (query: UserListQuery) => {
  return await axiosBasic.get<ApiResponse<PagedResult<ManagerScopedUserResponse>>>(
    "/api/manager/users",
    {
      params: query,
    }
  );
};

const getMyBranches = async () => {
  return await axiosBasic.get<ApiResponse<BranchResponse[]>>("/api/me/branches");
};

export const useManagerUsersQuery = (query: UserListQuery, enabled = true) => {
  return useQuery<
    ApiResponse<PagedResult<ManagerScopedUserResponse>>,
    PagedResult<ManagerScopedUserResponse>
  >({
    queryKey: [
      QUERY_KEY.MANAGER_USERS,
      String(query.pageNumber),
      String(query.pageSize),
      query.search ?? "",
      query.role ?? "",
      query.branchId ?? "",
      String(query.isActive ?? ""),
      String(query.isBanned ?? ""),
      query.sortBy ?? "",
      query.sortDirection ?? "asc",
    ],
    queryFn: () => getManagerUsers(query),
    select: (res) => res.data.result,
    enabled,
  });
};

export const useMyBranchesQuery = (enabled = true) => {
  return useQuery<ApiResponse<BranchResponse[]>, BranchResponse[]>({
    queryKey: [QUERY_KEY.MY_BRANCHES],
    queryFn: getMyBranches,
    select: (res) => res.data.result,
    enabled,
  });
};

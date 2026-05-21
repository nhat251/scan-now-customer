import useMutation from "@/hooks/useMutation";
import { axiosBasic } from "@/services/axiosBasic";
import type { ApiResponse } from "@/types/commons";
import type {
  CreateManagedUserRequest,
  ManagerScopedUserResponse,
  UpdateManagedUserRequest,
} from "@/types/user-management";

export const createManagerUser = async (req: CreateManagedUserRequest) => {
  const response = await axiosBasic.post<ApiResponse<ManagerScopedUserResponse>>("/api/manager/users", req);
  return response.data.result;
};

export const updateManagerUser = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateManagedUserRequest;
}) => {
  const response = await axiosBasic.put<ApiResponse<ManagerScopedUserResponse>>(`/api/manager/users/${id}`, data);
  return response.data.result;
};

export const banManagerUser = async (id: string) => {
  await axiosBasic.patch<ApiResponse<null>>(`/api/manager/users/${id}/ban`);
};

export const unbanManagerUser = async (id: string) => {
  await axiosBasic.patch<ApiResponse<null>>(`/api/manager/users/${id}/unban`);
};

export const useCreateManagerUserMutation = () => {
  return useMutation<CreateManagedUserRequest, ManagerScopedUserResponse>({
    mutationFn: createManagerUser,
  });
};

export const useUpdateManagerUserMutation = () => {
  return useMutation<{ id: string; data: UpdateManagedUserRequest }, ManagerScopedUserResponse>({
    mutationFn: updateManagerUser,
  });
};

export const useBanManagerUserMutation = () => {
  return useMutation<string, Promise<void>>({
    mutationFn: banManagerUser,
  });
};

export const useUnbanManagerUserMutation = () => {
  return useMutation<string, Promise<void>>({
    mutationFn: unbanManagerUser,
  });
};

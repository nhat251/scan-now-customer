import useMutation from "@/hooks/useMutation";
import { axiosBasic } from "@/services/axiosBasic";
import type { ApiResponse } from "@/types/commons";
import type {
  CreateManagerUserRequest,
  ManagerScopedUserResponse,
  UpdateManagerUserRequest,
} from "@/types/user-management";

type UpdateManagerUserParams = {
  id: string;
  data: UpdateManagerUserRequest;
};

export async function createManagerUser(
  req: CreateManagerUserRequest
): Promise<ManagerScopedUserResponse> {
  const response = await axiosBasic.post<ApiResponse<ManagerScopedUserResponse>>(
    "/api/manager/users",
    req
  );
  return response.data.result;
}

export async function updateManagerUser({
  id,
  data,
}: UpdateManagerUserParams): Promise<ManagerScopedUserResponse> {
  const response = await axiosBasic.put<ApiResponse<ManagerScopedUserResponse>>(
    `/api/manager/users/${id}`,
    data
  );
  return response.data.result;
}

export async function banManagerUser(id: string): Promise<void> {
  await axiosBasic.patch<ApiResponse<null>>(`/api/manager/users/${id}/ban`);
}

export async function unbanManagerUser(id: string): Promise<void> {
  await axiosBasic.patch<ApiResponse<null>>(`/api/manager/users/${id}/unban`);
}

export const useCreateManagerUserMutation = () => {
  return useMutation<CreateManagerUserRequest, ManagerScopedUserResponse>({
    mutationFn: createManagerUser,
  });
};

export const useUpdateManagerUserMutation = () => {
  return useMutation<UpdateManagerUserParams, ManagerScopedUserResponse>({
    mutationFn: updateManagerUser,
  });
};

export const useBanManagerUserMutation = () => {
  return useMutation<string, void>({
    mutationFn: banManagerUser,
  });
};

export const useUnbanManagerUserMutation = () => {
  return useMutation<string, void>({
    mutationFn: unbanManagerUser,
  });
};

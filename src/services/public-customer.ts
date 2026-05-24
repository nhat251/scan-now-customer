import { axiosBasic } from "@/services/axiosBasic";
import type { ApiResponse } from "@/types/api";
import type {
  JoinSessionRequest,
  JoinSessionResponse,
  PublicCategoryResponse,
  PublicTableResponse,
  SessionMenuQuery,
  SessionMenuResponse,
} from "@/types/customer-session";

export const getPublicTable = async (qrCodeToken: string) => {
  return await axiosBasic.get<ApiResponse<PublicTableResponse>>(`/api/public/tables/${qrCodeToken}`);
};

export const joinPublicSession = async (request: JoinSessionRequest) => {
  const response = await axiosBasic.post<ApiResponse<JoinSessionResponse>>("/api/public/sessions/join", request);

  return response.data;
};

export const getPublicSessionMenu = async (sessionCode: string, query: SessionMenuQuery) => {
  return await axiosBasic.get<ApiResponse<SessionMenuResponse>>(`/api/public/sessions/${sessionCode}/menu`, {
    params: query,
  });
};

export const getPublicBranchCategories = async (branchId: string) => {
  return await axiosBasic.get<ApiResponse<PublicCategoryResponse[]>>(`/api/public/branches/${branchId}/categories`);
};

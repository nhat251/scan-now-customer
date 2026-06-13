import { axiosBasic } from "@/services/axiosBasic";
import type { ApiResponse, PagedResult } from "@/types/api";
import type {
  CreateOwnerTableRequest,
  OwnerOrderInvoiceListResponse,
  OwnerOrderInvoiceQuery,
  OwnerTableOrderHistoryResponse,
  OwnerTableResponse,
  OwnerTablesQuery,
  RegenerateOwnerTableQrResponse,
  UpdateOwnerTableRequest,
  UpdateOwnerTableStatusRequest,
} from "@/types/owner-table";

export const getOwnerBranchTables = async (branchId: string, query: OwnerTablesQuery) => {
  return await axiosBasic.get<ApiResponse<PagedResult<OwnerTableResponse>>>(
    `/api/owner/branches/${branchId}/tables`,
    { params: query }
  );
};

export const getOwnerTable = async (branchId: string, tableId: string) => {
  return await axiosBasic.get<ApiResponse<OwnerTableResponse>>(
    `/api/owner/branches/${branchId}/tables/${tableId}`
  );
};

export const getOwnerTableOrderHistory = async (branchId: string, tableId: string) => {
  return await axiosBasic.get<ApiResponse<OwnerTableOrderHistoryResponse[]>>(
    `/api/owner/branches/${branchId}/tables/${tableId}/orders`
  );
};

export const getOwnerBranchOrders = async (branchId: string, query: OwnerOrderInvoiceQuery) => {
  return await axiosBasic.get<ApiResponse<OwnerOrderInvoiceListResponse>>(
    `/api/owner/branches/${branchId}/orders`,
    { params: query }
  );
};

export const createOwnerTable = async ({
  branchId,
  data,
}: {
  branchId: string;
  data: CreateOwnerTableRequest;
}) => {
  return await axiosBasic.post<ApiResponse<OwnerTableResponse>>(
    `/api/owner/branches/${branchId}/tables`,
    data
  );
};

export const updateOwnerTable = async ({
  tableId,
  data,
}: {
  tableId: string;
  data: UpdateOwnerTableRequest;
}) => {
  return await axiosBasic.put<ApiResponse<OwnerTableResponse>>(`/api/owner/tables/${tableId}`, data);
};

export const updateOwnerTableStatus = async ({
  tableId,
  data,
}: {
  tableId: string;
  data: UpdateOwnerTableStatusRequest;
}) => {
  return await axiosBasic.patch<ApiResponse<OwnerTableResponse>>(
    `/api/owner/tables/${tableId}/status`,
    data
  );
};

export const setOwnerTableActive = async ({ tableId, isActive }: { tableId: string; isActive: boolean }) => {
  return await axiosBasic.patch<ApiResponse<OwnerTableResponse>>(
    `/api/owner/tables/${tableId}/${isActive ? "activate" : "deactivate"}`
  );
};

export const regenerateOwnerTableQr = async (tableId: string) => {
  return await axiosBasic.post<ApiResponse<RegenerateOwnerTableQrResponse>>(
    `/api/owner/tables/${tableId}/regenerate-qr`
  );
};

export const downloadOwnerTableQrImage = async (tableId: string) => {
  return await axiosBasic.get<Blob>(`/api/owner/tables/${tableId}/qr-image`, {
    responseType: "blob",
  });
};

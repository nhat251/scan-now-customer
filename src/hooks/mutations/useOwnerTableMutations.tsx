import { isAxiosError } from "axios";

import { QUERY_KEY } from "@/constants/queryKeys";
import useMutation from "@/hooks/useMutation";
import {
  createOwnerTable,
  downloadOwnerTableQrImage,
  regenerateOwnerTableQr,
  setOwnerTableActive,
  updateOwnerTable,
  updateOwnerTableStatus,
} from "@/services/owner-table";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type {
  CreateOwnerTableRequest,
  OwnerTableResponse,
  RegenerateOwnerTableQrResponse,
  UpdateOwnerTableRequest,
  UpdateOwnerTableStatusRequest,
} from "@/types/owner-table";
import { useQueryClient } from "@tanstack/react-query";

type BranchTablePayload<TData> = {
  branchId: string;
  data: TData;
};

const getOwnerTableErrorMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data as { message?: string; detail?: string; title?: string } | undefined;

  return data?.message ?? data?.detail ?? data?.title ?? fallback;
};

const useRefreshOwnerTables = () => {
  const queryClient = useQueryClient();

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.OWNER_BRANCH_TABLES] });
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.OWNER_TABLE] });
  };

  return { refresh };
};

export const useCreateOwnerTableMutation = () => {
  const { refresh } = useRefreshOwnerTables();

  return useMutation<BranchTablePayload<CreateOwnerTableRequest>, ApiResponse<OwnerTableResponse>>({
    mutationFn: async (payload) => (await createOwnerTable(payload)).data,
    hasLoading: true,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Table created successfully." });
    },
    onError: (error) =>
      showNotify({ type: "error", message: getOwnerTableErrorMessage(error, "Unable to create table.") }),
  });
};

export const useUpdateOwnerTableMutation = () => {
  const { refresh } = useRefreshOwnerTables();

  return useMutation<{ tableId: string; data: UpdateOwnerTableRequest }, ApiResponse<OwnerTableResponse>>({
    mutationFn: async (payload) => (await updateOwnerTable(payload)).data,
    hasLoading: true,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Table updated successfully." });
    },
    onError: (error) =>
      showNotify({ type: "error", message: getOwnerTableErrorMessage(error, "Unable to update table.") }),
  });
};

export const useUpdateOwnerTableStatusMutation = () => {
  const { refresh } = useRefreshOwnerTables();

  return useMutation<{ tableId: string; data: UpdateOwnerTableStatusRequest }, ApiResponse<OwnerTableResponse>>({
    mutationFn: async (payload) => (await updateOwnerTableStatus(payload)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Table status updated." });
    },
    onError: (error) =>
      showNotify({ type: "error", message: getOwnerTableErrorMessage(error, "Unable to update table status.") }),
  });
};

export const useSetOwnerTableActiveMutation = () => {
  const { refresh } = useRefreshOwnerTables();

  return useMutation<{ tableId: string; isActive: boolean }, ApiResponse<OwnerTableResponse>>({
    mutationFn: async (payload) => (await setOwnerTableActive(payload)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Table active state updated." });
    },
    onError: (error) =>
      showNotify({ type: "error", message: getOwnerTableErrorMessage(error, "Unable to update table active state.") }),
  });
};

export const useRegenerateOwnerTableQrMutation = () => {
  const { refresh } = useRefreshOwnerTables();

  return useMutation<string, ApiResponse<RegenerateOwnerTableQrResponse>>({
    mutationFn: async (tableId) => (await regenerateOwnerTableQr(tableId)).data,
    hasLoading: true,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "QR regenerated successfully." });
    },
    onError: (error) =>
      showNotify({ type: "error", message: getOwnerTableErrorMessage(error, "Cannot regenerate QR.") }),
  });
};

export const useDownloadOwnerTableQrMutation = () => {
  return useMutation<string, Blob>({
    mutationFn: async (tableId) => (await downloadOwnerTableQrImage(tableId)).data,
    onError: (error) =>
      showNotify({ type: "error", message: getOwnerTableErrorMessage(error, "Cannot download QR image.") }),
  });
};

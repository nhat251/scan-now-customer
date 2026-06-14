import { QUERY_KEY } from "@/constants/queryKeys";
import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
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
      showNotify({ type: "success", message: "Đã tạo bàn." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể tạo bàn."),
      }),
  });
};

export const useUpdateOwnerTableMutation = () => {
  const { refresh } = useRefreshOwnerTables();

  return useMutation<
    { tableId: string; data: UpdateOwnerTableRequest },
    ApiResponse<OwnerTableResponse>
  >({
    mutationFn: async (payload) => (await updateOwnerTable(payload)).data,
    hasLoading: true,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Đã cập nhật bàn." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể cập nhật bàn."),
      }),
  });
};

export const useUpdateOwnerTableStatusMutation = () => {
  const { refresh } = useRefreshOwnerTables();

  return useMutation<
    { tableId: string; data: UpdateOwnerTableStatusRequest },
    ApiResponse<OwnerTableResponse>
  >({
    mutationFn: async (payload) => (await updateOwnerTableStatus(payload)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Đã cập nhật trạng thái bàn." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể cập nhật trạng thái bàn."),
      }),
  });
};

export const useSetOwnerTableActiveMutation = () => {
  const { refresh } = useRefreshOwnerTables();

  return useMutation<{ tableId: string; isActive: boolean }, ApiResponse<OwnerTableResponse>>({
    mutationFn: async (payload) => (await setOwnerTableActive(payload)).data,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Đã cập nhật trạng thái hoạt động của bàn." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(
          error,
          "Không thể cập nhật trạng thái hoạt động của bàn."
        ),
      }),
  });
};

export const useRegenerateOwnerTableQrMutation = () => {
  const { refresh } = useRefreshOwnerTables();

  return useMutation<string, ApiResponse<RegenerateOwnerTableQrResponse>>({
    mutationFn: async (tableId) => (await regenerateOwnerTableQr(tableId)).data,
    hasLoading: true,
    onSuccess: async () => {
      await refresh();
      showNotify({ type: "success", message: "Đã tạo lại mã QR." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể tạo lại mã QR."),
      }),
  });
};

export const useDownloadOwnerTableQrMutation = () => {
  return useMutation<string, Blob>({
    mutationFn: async (tableId) => (await downloadOwnerTableQrImage(tableId)).data,
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể tải hình ảnh mã QR."),
      }),
  });
};

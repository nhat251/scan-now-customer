import { QUERY_KEY } from "@/constants/queryKeys";
import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import useMutation from "@/hooks/useMutation";
import { closeMyTableSession, openMyTableSession } from "@/services/me";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type { OpenTableSessionResponse } from "@/types/me";
import { useQueryClient } from "@tanstack/react-query";

type OpenTablePayload = {
  branchId: string;
  tableId: string;
};

export const useOpenMyTableSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<OpenTablePayload, ApiResponse<OpenTableSessionResponse>>({
    mutationFn: async (payload) => {
      const response = await openMyTableSession(payload);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.MY_BRANCH_TABLES] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.MY_TABLE] });
      showNotify({ type: "success", message: "Đã mở bàn." });
    },
    onError: (error) => {
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể mở phiên bàn."),
      });
    },
  });
};

export const useCloseMyTableSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<string, ApiResponse<unknown>>({
    mutationFn: async (sessionId) => {
      const response = await closeMyTableSession(sessionId);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.MY_BRANCH_TABLES] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.MY_TABLE] });
      showNotify({ type: "success", message: "Đã đóng phiên bàn." });
    },
    onError: (error) => {
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể đóng phiên bàn."),
      });
    },
  });
};

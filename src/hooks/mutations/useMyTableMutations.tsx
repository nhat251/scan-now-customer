import { isAxiosError } from "axios";

import { QUERY_KEY } from "@/constants/queryKeys";
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

const getTableOperationErrorMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data as { message?: string; detail?: string; title?: string } | undefined;

  return data?.message ?? data?.detail ?? data?.title ?? fallback;
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
      showNotify({ type: "success", message: "Table opened successfully." });
    },
    onError: (error) => {
      showNotify({
        type: "error",
        message: getTableOperationErrorMessage(error, "Cannot open table session."),
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
      showNotify({ type: "success", message: "Session closed successfully." });
    },
    onError: (error) => {
      showNotify({
        type: "error",
        message: getTableOperationErrorMessage(error, "Cannot close session."),
      });
    },
  });
};

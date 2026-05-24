import useMutation from "@/hooks/useMutation";
import { joinPublicSession } from "@/services/public-customer";
import type { ApiResponse } from "@/types/api";
import type { JoinSessionRequest, JoinSessionResponse } from "@/types/customer-session";

export const useJoinPublicSessionMutation = () => {
  return useMutation<JoinSessionRequest, ApiResponse<JoinSessionResponse>>({
    mutationFn: joinPublicSession,
    hasLoading: true,
  });
};

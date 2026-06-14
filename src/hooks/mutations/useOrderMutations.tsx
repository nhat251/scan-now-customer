import { QUERY_KEY } from "@/constants/queryKeys";
import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import useMutation from "@/hooks/useMutation";
import type { CreateWaiterOrderRequest } from "@/services/order";
import {
  cancelPublicPayment,
  confirmKitchenItems,
  confirmKitchenOrder,
  confirmWaiterOrder,
  createPublicCheckout,
  createWaiterOrder,
  markKitchenItemsReady,
  markWaiterItemsServed,
  placePublicOrder,
} from "@/services/order";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type {
  CheckoutResponse,
  ConfirmKitchenItemsResponse,
  ConfirmOrderResponse,
  CreateCheckoutRequest,
  CustomerOrderResponse,
  MarkItemsServedResponse,
  PaymentStatusResponse,
  PlaceOrderRequest,
  UpdateKitchenItemsResponse,
  UpdateOrderItemsStatusRequest,
} from "@/types/order";
import { useQueryClient } from "@tanstack/react-query";

type PlaceOrderPayload = {
  sessionCode: string;
  request: PlaceOrderRequest;
};

type BranchOrderPayload = {
  branchId: string;
  orderId: string;
};

type BranchItemsPayload = {
  branchId: string;
  request: UpdateOrderItemsStatusRequest;
};

type CheckoutPayload = {
  sessionCode: string;
  request: CreateCheckoutRequest;
};

type CancelPaymentPayload = {
  sessionCode: string;
};

export const usePlacePublicOrderMutation = () => {
  return useMutation<PlaceOrderPayload, ApiResponse<CustomerOrderResponse>>({
    mutationFn: placePublicOrder,
    hasLoading: true,
    onSuccess: () => showNotify({ type: "success", message: "Đơn hàng đã được gửi để xác nhận." }),
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể gửi đơn hàng."),
      }),
  });
};

export const useCreatePublicCheckoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<CheckoutPayload, ApiResponse<CheckoutResponse>>({
    mutationFn: createPublicCheckout,
    hasLoading: true,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.PUBLIC_ORDER] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.PUBLIC_PAYMENT_STATUS] });
      showNotify({ type: "success", message: "Đã tạo yêu cầu thanh toán." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể tạo yêu cầu thanh toán."),
      }),
  });
};

export const useConfirmWaiterOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<BranchOrderPayload, ApiResponse<ConfirmOrderResponse>>({
    mutationFn: confirmWaiterOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.WAITER_PENDING_ORDERS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.KITCHEN_GROUPED_ITEMS] });
      showNotify({ type: "success", message: "Đã xác nhận đơn và gửi đến bếp." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể xác nhận đơn hàng."),
      }),
  });
};

export const useCancelPublicPaymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<CancelPaymentPayload, ApiResponse<PaymentStatusResponse>>({
    mutationFn: ({ sessionCode }) => cancelPublicPayment(sessionCode),
    hasLoading: true,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.PUBLIC_ORDER] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.PUBLIC_PAYMENT_STATUS] });
      showNotify({ type: "success", message: "Đã hủy mã QR thanh toán." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể hủy mã QR thanh toán."),
      }),
  });
};

export const useConfirmKitchenOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<BranchOrderPayload, ApiResponse<ConfirmOrderResponse>>({
    mutationFn: confirmKitchenOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.KITCHEN_PENDING_ORDERS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.KITCHEN_GROUPED_ITEMS] });
      showNotify({ type: "success", message: "Đã xác nhận đơn và thêm vào hàng chờ của bếp." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể xác nhận đơn hàng."),
      }),
  });
};

export const useConfirmKitchenItemsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<BranchItemsPayload, ApiResponse<ConfirmKitchenItemsResponse>>({
    mutationFn: confirmKitchenItems,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.KITCHEN_PENDING_ORDERS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.KITCHEN_GROUPED_ITEMS] });
      showNotify({ type: "success", message: "Đã xác nhận các món được chọn." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể xác nhận các món đã chọn."),
      }),
  });
};

export const useMarkWaiterItemsServedMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<BranchItemsPayload, ApiResponse<MarkItemsServedResponse>>({
    mutationFn: markWaiterItemsServed,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.WAITER_READY_ITEMS] });
      showNotify({ type: "success", message: "Đã đánh dấu các món được chọn là đã phục vụ." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(
          error,
          "Không thể đánh dấu các món đã chọn là đã phục vụ."
        ),
      }),
  });
};

export const useCreateWaiterOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { branchId: string; request: CreateWaiterOrderRequest },
    ApiResponse<CustomerOrderResponse>
  >({
    mutationFn: createWaiterOrder,
    hasLoading: true,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.WAITER_PENDING_ORDERS] });
      showNotify({ type: "success", message: "Đã tạo đơn hàng." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể tạo đơn hàng."),
      }),
  });
};

export const useMarkKitchenItemsReadyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<BranchItemsPayload, ApiResponse<UpdateKitchenItemsResponse>>({
    mutationFn: markKitchenItemsReady,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.KITCHEN_GROUPED_ITEMS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.WAITER_READY_ITEMS] });
      showNotify({ type: "success", message: "Các món được chọn đã sẵn sàng phục vụ." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(
          error,
          "Không thể đánh dấu các món đã chọn là sẵn sàng."
        ),
      }),
  });
};

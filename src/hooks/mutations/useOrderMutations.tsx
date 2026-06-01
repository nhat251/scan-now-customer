import { isAxiosError } from "axios";

import { QUERY_KEY } from "@/constants/queryKeys";
import useMutation from "@/hooks/useMutation";
import {
  cancelPublicPayment,
  confirmKitchenItems,
  confirmKitchenOrder,
  confirmWaiterOrder,
  createPublicCheckout,
  markKitchenItemsReady,
  markWaiterItemsServed,
  placePublicOrder,
} from "@/services/order";
import { showNotify } from "@/stores/global";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";
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

const getOrderErrorMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError<ApiErrorResponse>(error)) {
    return fallback;
  }

  return error.response?.data?.message ?? error.response?.data?.detail ?? error.response?.data?.title ?? fallback;
};

export const usePlacePublicOrderMutation = () => {
  return useMutation<PlaceOrderPayload, ApiResponse<CustomerOrderResponse>>({
    mutationFn: placePublicOrder,
    hasLoading: true,
    onSuccess: () => showNotify({ type: "success", message: "Your order was submitted for confirmation." }),
    onError: (error) =>
      showNotify({ type: "error", message: getOrderErrorMessage(error, "Unable to submit this order.") }),
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
      showNotify({ type: "success", message: "Payment request created." });
    },
    onError: (error) =>
      showNotify({ type: "error", message: getOrderErrorMessage(error, "Unable to create payment request.") }),
  });
};

export const useConfirmWaiterOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<BranchOrderPayload, ApiResponse<ConfirmOrderResponse>>({
    mutationFn: confirmWaiterOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.WAITER_PENDING_ORDERS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.KITCHEN_GROUPED_ITEMS] });
      showNotify({ type: "success", message: "Order confirmed and sent to kitchen." });
    },
    onError: (error) =>
      showNotify({ type: "error", message: getOrderErrorMessage(error, "Unable to confirm this order.") }),
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
      showNotify({ type: "success", message: "Payment QR cancelled." });
    },
    onError: (error) =>
      showNotify({ type: "error", message: getOrderErrorMessage(error, "Unable to cancel payment QR.") }),
  });
};

export const useConfirmKitchenOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<BranchOrderPayload, ApiResponse<ConfirmOrderResponse>>({
    mutationFn: confirmKitchenOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.KITCHEN_PENDING_ORDERS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.KITCHEN_GROUPED_ITEMS] });
      showNotify({ type: "success", message: "Order confirmed and added to kitchen queue." });
    },
    onError: (error) =>
      showNotify({ type: "error", message: getOrderErrorMessage(error, "Unable to confirm this order.") }),
  });
};

export const useConfirmKitchenItemsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<BranchItemsPayload, ApiResponse<ConfirmKitchenItemsResponse>>({
    mutationFn: confirmKitchenItems,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.KITCHEN_PENDING_ORDERS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.KITCHEN_GROUPED_ITEMS] });
      showNotify({ type: "success", message: "Selected dishes confirmed." });
    },
    onError: (error) =>
      showNotify({ type: "error", message: getOrderErrorMessage(error, "Unable to confirm selected dishes.") }),
  });
};

export const useMarkWaiterItemsServedMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<BranchItemsPayload, ApiResponse<MarkItemsServedResponse>>({
    mutationFn: markWaiterItemsServed,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.WAITER_READY_ITEMS] });
      showNotify({ type: "success", message: "Selected dishes marked as served." });
    },
    onError: (error) =>
      showNotify({ type: "error", message: getOrderErrorMessage(error, "Unable to mark selected dishes served.") }),
  });
};

export const useMarkKitchenItemsReadyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<BranchItemsPayload, ApiResponse<UpdateKitchenItemsResponse>>({
    mutationFn: markKitchenItemsReady,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.KITCHEN_GROUPED_ITEMS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.WAITER_READY_ITEMS] });
      showNotify({ type: "success", message: "Selected dishes are ready to serve." });
    },
    onError: (error) =>
      showNotify({ type: "error", message: getOrderErrorMessage(error, "Unable to mark selected dishes ready.") }),
  });
};

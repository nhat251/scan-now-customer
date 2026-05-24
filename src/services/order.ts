import { axiosBasic } from "@/services/axiosBasic";
import type { ApiResponse } from "@/types/api";
import type {
  CheckoutResponse,
  ConfirmOrderResponse,
  CreateCheckoutRequest,
  CustomerOrderResponse,
  GroupedKitchenItem,
  MarkItemsServedRequest,
  MarkItemsServedResponse,
  PaymentStatusResponse,
  PendingOrderResponse,
  PlaceOrderRequest,
  ReadyToServeTableGroup,
  UpdateKitchenItemsResponse,
  UpdateOrderItemsStatusRequest,
} from "@/types/order";

export const placePublicOrder = async ({ sessionCode, request }: { sessionCode: string; request: PlaceOrderRequest }) => {
  const response = await axiosBasic.post<ApiResponse<CustomerOrderResponse>>(
    `/api/public/sessions/${sessionCode}/orders`,
    request
  );

  return response.data;
};

export const getOrderDetail = async (sessionCode: string, orderId: string) => {
  return await axiosBasic.get<ApiResponse<CustomerOrderResponse>>(
    `/api/public/sessions/${sessionCode}/orders/${orderId}`
  );
};

export const createPublicCheckout = async ({
  sessionCode,
  request,
}: {
  sessionCode: string;
  request: CreateCheckoutRequest;
}) => {
  const response = await axiosBasic.post<ApiResponse<CheckoutResponse>>(
    `/api/public/sessions/${sessionCode}/checkout`,
    request
  );

  return response.data;
};

export const getPublicPaymentStatus = async (sessionCode: string) => {
  return await axiosBasic.get<ApiResponse<PaymentStatusResponse>>(
    `/api/public/sessions/${sessionCode}/payment-status`
  );
};

export const getPendingWaiterOrders = async (branchId: string) => {
  return await axiosBasic.get<ApiResponse<PendingOrderResponse[]>>("/api/waiter/orders/pending-confirmation", {
    params: { branchId },
  });
};

export const confirmWaiterOrder = async ({ branchId, orderId }: { branchId: string; orderId: string }) => {
  const response = await axiosBasic.post<ApiResponse<ConfirmOrderResponse>>(
    `/api/waiter/orders/${orderId}/confirm`,
    undefined,
    { params: { branchId } }
  );

  return response.data;
};

export const getReadyToServeItems = async (branchId: string) => {
  return await axiosBasic.get<ApiResponse<ReadyToServeTableGroup[]>>("/api/waiter/items/ready-to-serve", {
    params: { branchId },
  });
};

export const markWaiterItemsServed = async ({
  branchId,
  request,
}: {
  branchId: string;
  request: MarkItemsServedRequest;
}) => {
  const response = await axiosBasic.post<ApiResponse<MarkItemsServedResponse>>(
    "/api/waiter/items/mark-served",
    request,
    { params: { branchId } }
  );

  return response.data;
};

export const getGroupedKitchenItems = async ({
  branchId,
  status,
}: {
  branchId: string;
  status?: "Confirmed" | "Cooking";
}) => {
  return await axiosBasic.get<ApiResponse<GroupedKitchenItem[]>>("/api/kitchen/items/grouped", {
    params: { branchId, status },
  });
};

export const startCookingItems = async ({
  branchId,
  request,
}: {
  branchId: string;
  request: UpdateOrderItemsStatusRequest;
}) => {
  const response = await axiosBasic.post<ApiResponse<UpdateKitchenItemsResponse>>(
    "/api/kitchen/items/start-cooking",
    request,
    { params: { branchId } }
  );

  return response.data;
};

export const markKitchenItemsReady = async ({
  branchId,
  request,
}: {
  branchId: string;
  request: UpdateOrderItemsStatusRequest;
}) => {
  const response = await axiosBasic.post<ApiResponse<UpdateKitchenItemsResponse>>(
    "/api/kitchen/items/mark-ready",
    request,
    { params: { branchId } }
  );

  return response.data;
};

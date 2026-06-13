import { axiosBasic } from "@/services/axiosBasic";
import type { ApiResponse } from "@/types/api";
import type {
  CheckoutResponse,
  CustomerOrderResponse,
  JoinSessionResponse,
  PaymentStatusResponse,
  PlaceOrderRequest,
  PublicTableResponse,
  SessionMenuResponse,
} from "@/types/public-ordering";

export const getPublicTable = async (
  qrCodeToken: string
): Promise<ApiResponse<PublicTableResponse>> => {
  const response = await axiosBasic.get<ApiResponse<PublicTableResponse>>(
    `/api/public/tables/${qrCodeToken}`
  );
  return response.data;
};

export const joinTableByQr = async (
  qrCodeToken: string
): Promise<ApiResponse<JoinSessionResponse>> => {
  const response = await axiosBasic.post<ApiResponse<JoinSessionResponse>>(
    `/api/public/tables/${qrCodeToken}/join`
  );
  return response.data;
};

export const getSessionMenu = async (
  sessionCode: string,
  params?: { search?: string; categoryId?: string; pageNumber?: number; pageSize?: number }
): Promise<ApiResponse<SessionMenuResponse>> => {
  const response = await axiosBasic.get<ApiResponse<SessionMenuResponse>>(
    `/api/public/sessions/${sessionCode}/menu`,
    {
      params,
    }
  );
  return response.data;
};

export const placeOrder = async (
  sessionCode: string,
  payload: PlaceOrderRequest
): Promise<ApiResponse<CustomerOrderResponse>> => {
  const response = await axiosBasic.post<ApiResponse<CustomerOrderResponse>>(
    `/api/public/sessions/${sessionCode}/orders`,
    payload
  );
  return response.data;
};

export const getOrderDetail = async (
  sessionCode: string,
  orderId: string
): Promise<ApiResponse<CustomerOrderResponse>> => {
  const response = await axiosBasic.get<ApiResponse<CustomerOrderResponse>>(
    `/api/public/sessions/${sessionCode}/orders/${orderId}`
  );
  return response.data;
};

export const checkoutSession = async (
  sessionCode: string,
  payload: { paymentMethod: "PAYOS" | "CASH" | string }
): Promise<ApiResponse<CheckoutResponse>> => {
  const response = await axiosBasic.post<ApiResponse<CheckoutResponse>>(
    `/api/public/sessions/${sessionCode}/checkout`,
    payload
  );
  return response.data;
};

export const getPaymentStatus = async (
  sessionCode: string
): Promise<ApiResponse<PaymentStatusResponse>> => {
  const response = await axiosBasic.get<ApiResponse<PaymentStatusResponse>>(
    `/api/public/sessions/${sessionCode}/payment-status`
  );
  return response.data;
};

export const cancelPendingPayment = async (
  sessionCode: string
): Promise<ApiResponse<PaymentStatusResponse>> => {
  const response = await axiosBasic.post<ApiResponse<PaymentStatusResponse>>(
    `/api/public/sessions/${sessionCode}/payment-cancel`
  );
  return response.data;
};

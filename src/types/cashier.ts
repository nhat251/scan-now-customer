import type { PagedResult } from "@/types/api";
import type { PaymentMethod } from "@/types/order";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

export type CashierOrderQuery = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: "active" | "paid" | "all";
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type CashierCheckoutRequest = {
  paymentMethod: Extract<PaymentMethod, "CASH" | "PAYOS">;
  voucherCode?: string | null;
  amountReceived?: number | null;
};

export type CashierPaymentResponse = {
  orderId: string;
  paymentId: string;
  paymentMethod: "CASH" | "PAYOS";
  paymentStatus: string;
  orderStatus: string;
  checkoutUrl: string | null;
  qrCode: string | null;
  bin: string | null;
  accountNumber: string | null;
  accountName: string | null;
  amount: number | null;
  amountReceived: number | null;
  changeAmount: number | null;
  description: string | null;
  paymentExpiresAt: string | null;
  order: OwnerTableOrderHistoryResponse;
};

export type CashierOrdersResult = PagedResult<OwnerTableOrderHistoryResponse>;

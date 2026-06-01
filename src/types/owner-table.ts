import type { PagedResult } from "@/types/api";
import type { OrderItemStatus, OrderStatus } from "@/types/order";

export type OwnerTableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "DISABLED";

export type OwnerTableSessionResponse = {
  sessionId: string;
  sessionCode: string;
  tableId?: string;
  branchId?: string;
  openedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  expiresAt: string;
  isActive: boolean;
};

export type OwnerTableResponse = {
  tableId: string;
  branchId: string;
  branchName: string;
  tableNumber: string;
  capacity: number;
  status: OwnerTableStatus | number;
  isActive: boolean;
  qrCodeToken?: string | null;
  qrCodeUrl?: string | null;
  qrCodeImageUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  currentSession: OwnerTableSessionResponse | null;
};

export type OwnerTablesQuery = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: OwnerTableStatus;
  capacity?: number;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type OwnerOrderInvoiceQuery = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  tableId?: string;
  tableNumber?: string;
  status?: OrderStatus;
  paymentMethod?: string;
  paymentStatus?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type CreateOwnerTableRequest = {
  tableNumber: string;
  capacity: number;
};

export type UpdateOwnerTableRequest = {
  tableNumber: string;
  capacity: number;
};

export type UpdateOwnerTableStatusRequest = {
  status: Exclude<OwnerTableStatus, "OCCUPIED">;
};

export type RegenerateOwnerTableQrResponse = {
  qrCodeToken: string;
  qrCodeUrl: string;
};

export type OwnerTableFormValues = {
  tableNumber: string;
  capacity: string;
};

export type OwnerTableOrderItemResponse = {
  orderItemId: string;
  menuItemId: string;
  menuItemName: string;
  unitPrice: number;
  quantity: number;
  subTotal: number;
  note: string | null;
  status: OrderItemStatus;
  estimatedCookingMinutes: number;
};

export type OwnerTableOrderHistoryResponse = {
  orderId: string;
  orderNumber: string;
  branchId: string;
  tableId: string | null;
  tableNumber: string | null;
  sessionCode: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerNote: string | null;
  subTotal: number;
  vatAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string | null;
  paymentStatus: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  items: OwnerTableOrderItemResponse[];
};

export type OwnerOrderInvoiceListResponse = {
  orders: PagedResult<OwnerTableOrderHistoryResponse>;
  totalOrders: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  refundedAmount: number;
};

export type OrderStatus =
  | "PendingConfirmation"
  | "Confirmed"
  | "Preparing"
  | "PartiallyReady"
  | "ReadyToServe"
  | "PartiallyServed"
  | "Served"
  | "Completed"
  | "Cancelled";

export type OrderItemStatus =
  | "Pending"
  | "Confirmed"
  | "Cooking"
  | "Ready"
  | "Served"
  | "Cancelled";

export type CustomerOrderItemResponse = {
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

export type CustomerOrderResponse = {
  orderId: string;
  orderNumber: string;
  branchId: string;
  tableId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerNote: string | null;
  subTotal: number;
  vatPercent: number;
  vatAmount: number;
  serviceChargePercent: number;
  serviceChargeAmount: number;
  totalAmount: number;
  status: OrderStatus;
  orderSource: string;
  createdAt: string;
  updatedAt: string | null;
  items: CustomerOrderItemResponse[];
};

export type PlaceOrderItemRequest = {
  menuItemId: string;
  quantity: number;
  note?: string | null;
};

export type PlaceOrderRequest = {
  customerName?: string | null;
  customerPhone?: string | null;
  customerNote?: string | null;
  items: PlaceOrderItemRequest[];
};

export type PendingOrderItemResponse = {
  orderItemId: string;
  menuItemId: string;
  menuItemName: string;
  unitPrice: number;
  quantity: number;
  subTotal: number;
  note: string | null;
  status: OrderItemStatus;
  createdAt: string;
};

export type PendingOrderResponse = {
  orderId: string;
  orderNumber: string;
  branchId: string;
  tableId: string | null;
  tableNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerNote: string | null;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  items: PendingOrderItemResponse[];
};

export type ConfirmOrderResponse = {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  confirmedAt: string | null;
  itemsConfirmed: number;
};

export type ReadyToServeItemResponse = {
  orderItemId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  note: string | null;
  readyAt: string | null;
};

export type ReadyToServeOrderGroup = {
  orderId: string;
  orderNumber: string;
  items: ReadyToServeItemResponse[];
};

export type ReadyToServeTableGroup = {
  tableId: string | null;
  tableNumber: string | null;
  orders: ReadyToServeOrderGroup[];
};

export type MarkItemsServedRequest = {
  orderItemIds: string[];
};

export type MarkItemsServedResponse = {
  itemsServed: number;
  affectedOrderIds: string[];
};

export type GroupedKitchenOrderItem = {
  orderItemId: string;
  orderId: string;
  orderCode: string;
  tableId: string | null;
  tableName: string | null;
  quantity: number;
  note: string | null;
  status: OrderItemStatus;
  confirmedAt: string | null;
  cookingStartedAt: string | null;
  estimatedCookingMinutes: number;
};

export type GroupedKitchenItem = {
  menuItemId: string;
  menuItemName: string;
  status: OrderItemStatus;
  note: string | null;
  totalQuantity: number;
  averageCookingMinutes: number;
  priorityScore: number;
  suggestedPriorityLevel: "Low" | "Medium" | "High";
  oldestConfirmedAt: string | null;
  waitingMinutes: number;
  items: GroupedKitchenOrderItem[];
};

export type UpdateOrderItemsStatusRequest = {
  orderItemIds: string[];
};

export type UpdateKitchenItemsResponse = {
  itemsUpdated: number;
  affectedOrderIds: string[];
};

export type ConfirmKitchenItemsResponse = {
  itemsConfirmed: number;
  affectedOrderIds: string[];
};

export type PaymentMethod = "PAYOS" | "CASH";

export type CreateCheckoutRequest = {
  paymentMethod: PaymentMethod;
};

export type CheckoutResponse = {
  orderId: string;
  paymentId: string;
  paymentMethod: PaymentMethod;
  checkoutUrl: string | null;
  qrCode: string | null;
  bin: string | null;
  accountNumber: string | null;
  accountName: string | null;
  amount: number | null;
  description: string | null;
  paymentExpiresAt: string | null;
};

export type PaymentStatusResponse = {
  orderId: string;
  paymentStatus: string;
  orderStatus: OrderStatus | string;
};

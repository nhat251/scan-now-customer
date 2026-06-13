export type PublicTableResponse = {
  tableId: string;
  branchId: string;
  branchName: string;
  tableNumber: string;
  status: "AVAILABLE" | "OCCUPIED" | "DISABLED" | string;
};

export type JoinSessionResponse = {
  sessionId: string;
  tableId: string;
  branchId: string;
  sessionCode: string;
  tableNumber: string;
  branchName: string;
  expiresAt: string;
};

export type MenuItemResponse = {
  menuItemId: string;
  branchId: string;
  branchName?: string | null;
  categoryId: string;
  categoryName?: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  costPrice?: number;
  preparationTime: number;
  displayOrder: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
};

export type MenuCategoryResponse = {
  categoryId: string;
  categoryName: string;
  displayOrder: number;
  items: MenuItemResponse[];
};

export type SessionMenuResponse = {
  session: JoinSessionResponse;
  menu: {
    items: MenuCategoryResponse[];
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
  note?: string;
};

export type PlaceOrderRequest = {
  customerName?: string;
  customerPhone?: string;
  customerNote?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    note?: string;
  }>;
};

export type CustomerOrderResponse = {
  orderId: string;
  orderNumber: string;
  branchId: string;
  tableId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerNote?: string | null;
  subTotal: number;
  vatPercent: number;
  vatAmount: number;
  serviceChargePercent: number;
  serviceChargeAmount: number;
  totalAmount: number;
  status: string;
  orderSource: string;
  items: Array<{
    orderItemId: string;
    menuItemId: string;
    menuItemName: string;
    unitPrice: number;
    quantity: number;
    subTotal: number;
    note?: string | null;
    status: string;
    estimatedCookingMinutes: number;
  }>;
  createdAt: string;
  updatedAt?: string | null;
};

export type CheckoutResponse = {
  orderId: string;
  paymentId: string;
  paymentMethod: "PAYOS" | "CASH" | string;
  checkoutUrl?: string | null;
  qrCode?: string | null;
  bin?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  amount?: number | null;
  description?: string | null;
  paymentExpiresAt?: string | null;
};

export type PaymentStatusResponse = {
  orderId: string;
  paymentStatus: "NO_PAYMENT" | "PENDING" | "SUCCESS" | "FAILED" | string;
  orderStatus: string;
};

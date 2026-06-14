import type {
  MyMenuCategoryResponse,
  MyMenuItemResponse,
  MyTableResponse,
} from "@/types/me";
import type {
  OwnerTableOrderHistoryResponse,
  OwnerTableOrderItemResponse,
} from "@/types/owner-table";
import type { OwnerReportResponse } from "@/types/reports";

export const createOrderItem = (
  overrides: Partial<OwnerTableOrderItemResponse> = {}
): OwnerTableOrderItemResponse => ({
  orderItemId: "item-1",
  menuItemId: "menu-1",
  menuItemName: "Phở bò",
  unitPrice: 50_000,
  quantity: 2,
  subTotal: 100_000,
  note: null,
  status: "Pending",
  estimatedCookingMinutes: 10,
  ...overrides,
});

export const createOrder = (
  overrides: Partial<OwnerTableOrderHistoryResponse> = {}
): OwnerTableOrderHistoryResponse => ({
  orderId: "order-1",
  orderNumber: "ORD-001",
  branchId: "branch-1",
  tableId: "table-1",
  tableNumber: "A01",
  sessionCode: "SESSION-1",
  customerName: "Nguyễn Văn A",
  customerPhone: null,
  customerNote: null,
  subTotal: 100_000,
  vatAmount: 10_000,
  serviceChargeAmount: 5_000,
  discountAmount: 0,
  totalAmount: 115_000,
  status: "PendingConfirmation",
  paymentMethod: null,
  paymentStatus: null,
  amountReceived: null,
  changeAmount: null,
  paidAt: null,
  createdAt: "2026-06-14T03:00:00.000Z",
  updatedAt: null,
  items: [createOrderItem()],
  ...overrides,
});

export const createTable = (
  overrides: Partial<MyTableResponse> = {}
): MyTableResponse => ({
  tableId: "table-1",
  branchId: "branch-1",
  branchName: "Chi nhánh trung tâm",
  tableNumber: "A01",
  capacity: 4,
  status: "AVAILABLE",
  isActive: true,
  createdAt: "2026-06-14T03:00:00.000Z",
  updatedAt: null,
  currentSession: null,
  ...overrides,
});

export const createMenuItem = (
  overrides: Partial<MyMenuItemResponse> = {}
): MyMenuItemResponse => ({
  menuItemId: "menu-1",
  branchId: "branch-1",
  branchName: "Chi nhánh trung tâm",
  categoryId: "category-1",
  categoryName: "Món chính",
  name: "Phở bò",
  description: "Phở bò truyền thống",
  imageUrl: null,
  price: 50_000,
  costPrice: 25_000,
  preparationTime: 10,
  displayOrder: 1,
  isAvailable: true,
  isFeatured: false,
  isActive: true,
  createdAt: "2026-06-14T03:00:00.000Z",
  updatedAt: null,
  ...overrides,
});

export const createMenuCategory = (
  overrides: Partial<MyMenuCategoryResponse> = {}
): MyMenuCategoryResponse => ({
  categoryId: "category-1",
  categoryName: "Món chính",
  displayOrder: 1,
  items: [createMenuItem()],
  ...overrides,
});

export const createReport = (
  overrides: Partial<OwnerReportResponse> = {}
): OwnerReportResponse => ({
  fromDate: "2026-06-01",
  toDate: "2026-06-30",
  totalRevenue: 1_000_000,
  paidRevenue: 800_000,
  pendingRevenue: 200_000,
  totalOrders: 10,
  completedOrders: 8,
  averageOrderValue: 100_000,
  revenueByDay: [
    { label: "01/06", date: "2026-06-01T00:00:00.000Z", revenue: 100_000, orders: 2 },
    { label: "02/06", date: "2026-06-02T00:00:00.000Z", revenue: 200_000, orders: 3 },
  ],
  peakHours: [
    { label: "10:00", date: null, revenue: 100_000, orders: 2 },
    { label: "12:00", date: null, revenue: 300_000, orders: 4 },
  ],
  topItems: [{ menuItemId: "menu-1", name: "Phở bò", quantity: 5, revenue: 250_000 }],
  branches: [{ branchId: "branch-1", branchName: "Trung tâm", revenue: 800_000, orders: 8 }],
  paymentMethods: [{ method: "CASH", amount: 400_000, count: 4 }],
  ...overrides,
});

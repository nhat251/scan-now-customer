import path from "node:path";

import type { Page } from "@playwright/test";

const branch = {
  branchId: "branch-1",
  restaurantId: "restaurant-1",
  managerId: null,
  managerName: null,
  name: "Chi nhánh trung tâm",
  slug: "trung-tam",
  address: "123 Nguyễn Huệ, Quận 1",
  phone: "0900000000",
  email: "trungtam@scannow.vn",
  openTime: "08:00",
  closeTime: "22:00",
  isActive: true,
  vatPercent: 10,
  serviceChargePercent: 5,
  serviceChargeFixed: 0,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: null,
};

const order = {
  orderId: "order-1",
  orderNumber: "ORD-001",
  branchId: "branch-1",
  tableId: "table-1",
  tableNumber: "A01",
  sessionCode: "SESSION-1",
  customerName: "Nguyễn Văn A",
  customerPhone: null,
  customerNote: "Ít hành",
  subTotal: 100_000,
  vatAmount: 10_000,
  serviceChargeAmount: 5_000,
  discountAmount: 0,
  totalAmount: 115_000,
  status: "ReadyToServe",
  paymentMethod: null,
  paymentStatus: null,
  amountReceived: null,
  changeAmount: null,
  paidAt: null,
  createdAt: "2026-06-14T03:00:00.000Z",
  updatedAt: null,
  items: [
    {
      orderItemId: "item-1",
      menuItemId: "menu-1",
      menuItemName: "Phở bò",
      unitPrice: 50_000,
      quantity: 2,
      subTotal: 100_000,
      note: null,
      status: "Ready",
      estimatedCookingMinutes: 10,
    },
  ],
};

const table = {
  tableId: "table-1",
  branchId: "branch-1",
  branchName: "Chi nhánh trung tâm",
  tableNumber: "A01",
  capacity: 4,
  status: "OCCUPIED",
  isActive: true,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: null,
  currentSession: {
    sessionId: "session-1",
    sessionCode: "SESSION-1",
    openedAt: "2026-06-14T02:00:00.000Z",
    createdAt: "2026-06-14T02:00:00.000Z",
    expiresAt: "2026-06-14T10:00:00.000Z",
    isActive: true,
  },
};

const menuItem = {
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
  isFeatured: true,
  isActive: true,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: null,
};

const report = {
  fromDate: "2026-06-01",
  toDate: "2026-06-30",
  totalRevenue: 1_000_000,
  paidRevenue: 800_000,
  pendingRevenue: 200_000,
  totalOrders: 10,
  completedOrders: 8,
  averageOrderValue: 100_000,
  revenueByDay: [
    {
      label: "01/06",
      date: "2026-06-01T00:00:00.000Z",
      revenue: 300_000,
      orders: 3,
    },
    {
      label: "02/06",
      date: "2026-06-02T00:00:00.000Z",
      revenue: 500_000,
      orders: 5,
    },
  ],
  peakHours: [
    { label: "10:00", date: null, revenue: 300_000, orders: 3 },
    { label: "12:00", date: null, revenue: 500_000, orders: 5 },
  ],
  topItems: [
    {
      menuItemId: "menu-1",
      name: "Phở bò",
      quantity: 8,
      revenue: 400_000,
    },
  ],
  branches: [
    {
      branchId: "branch-1",
      branchName: "Chi nhánh trung tâm",
      revenue: 800_000,
      orders: 8,
    },
  ],
  paymentMethods: [
    { method: "CASH", amount: 500_000, count: 5 },
    { method: "PAYOS", amount: 300_000, count: 3 },
  ],
};

const paged = <T>(items: T[]) => ({
  items,
  pageNumber: 1,
  pageSize: 100,
  totalItems: items.length,
  totalPages: 1,
});

const apiResponse = (result: unknown) => ({
  code: 200,
  message: "Thành công",
  result,
  statusCode: 200,
});

const corsHeaders = {
  "access-control-allow-headers": "authorization, content-type, x-tenant-slug",
  "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "access-control-allow-origin": "http://127.0.0.1:3000",
  "access-control-allow-credentials": "true",
};

export const mockDashboardSession = async (
  page: Page,
  role: "OWNER" | "STAFF" | "CASHIER"
) => {
  await page.clock.setFixedTime(new Date("2026-06-14T05:00:00.000Z"));
  await page.addInitScript(
    ({ authRole }) => {
      window.localStorage.setItem("jwt", "e2e-token");
      window.localStorage.setItem(
        "auth-user",
        JSON.stringify({
          id: "user-1",
          email: "nhanvien@scannow.vn",
          username: "nhanvien",
          fullName: "Nguyễn Văn Nhân",
          avatarUrl: null,
          role: authRole,
          isEmailVerified: true,
          isActive: true,
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: null,
        })
      );
    },
    { authRole: role }
  );

  await page.route("**/hubs/orders/**", async (route) => {
    await route.abort();
  });
  await page.route("**/_next/image?**", async (route) => {
    await route.fulfill({
      contentType: "image/png",
      path: path.resolve(process.cwd(), "public/images/default-image.png"),
    });
  });
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({ headers: corsHeaders, status: 204 });
      return;
    }

    const pathname = new URL(request.url()).pathname;
    let result: unknown;

    if (pathname === "/api/me/branches") {
      result = [branch];
    } else if (pathname === "/api/me/branches/branch-1/tables") {
      result = paged([table]);
    } else if (pathname === "/api/me/branches/branch-1/menu") {
      result = paged([
        {
          categoryId: "category-1",
          categoryName: "Món chính",
          displayOrder: 1,
          items: [menuItem],
        },
      ]);
    } else if (pathname === "/api/cashier/branches/branch-1/orders") {
      result = paged([order]);
    } else if (pathname === "/api/waiter/items/ready-to-serve") {
      result = [
        {
          tableId: "table-1",
          tableNumber: "A01",
          orders: [
            {
              orderId: "order-1",
              orderNumber: "ORD-001",
              items: [
                {
                  orderItemId: "item-1",
                  menuItemId: "menu-1",
                  menuItemName: "Phở bò",
                  quantity: 2,
                  note: null,
                  readyAt: "2026-06-14T04:30:00.000Z",
                },
              ],
            },
          ],
        },
      ];
    } else if (pathname === "/api/owner/branches") {
      result = paged([branch]);
    } else if (pathname === "/api/owner/reports/overview") {
      result = report;
    } else {
      await route.fulfill({
        headers: corsHeaders,
        json: {
          code: 404,
          message: "Không tìm thấy dữ liệu kiểm thử.",
          result: null,
          statusCode: 404,
        },
        status: 404,
      });
      return;
    }

    await route.fulfill({
      headers: corsHeaders,
      json: apiResponse(result),
      status: 200,
    });
  });
};

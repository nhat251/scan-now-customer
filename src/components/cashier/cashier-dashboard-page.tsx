"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  CreditCard,
  Grid2x2,
  History,
  Loader2,
  MonitorDot,
  PlusCircle,
  Printer,
  ReceiptText,
  RefreshCw,
  Search,
  Table2,
  Wallet,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";

import { formatCurrency } from "@/components/customer/customer-session-utils";
import { formatDateTime, getOwnerTableErrorMessage } from "@/components/owner/tables/helpers";
import { getQrImageSrc, PayOsQrPanel } from "@/components/payment/payos-qr-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FooterPagination } from "@/components/ui/footer-pagination";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useCashierCancelPaymentMutation, useCashierCheckoutMutation } from "@/hooks/mutations/useCashierMutations";
import { useCloseMyTableSessionMutation, useOpenMyTableSessionMutation } from "@/hooks/mutations/useMyTableMutations";
import { useCreateWaiterOrderMutation } from "@/hooks/mutations/useOrderMutations";
import { useCashierOrdersQuery } from "@/hooks/queries/useCashierQueries";
import { useMyBranchesListQuery, useMyBranchMenuQuery, useMyBranchTablesQuery } from "@/hooks/queries/useMeQueries";
import { useBranchOrderUpdates } from "@/hooks/useBranchOrderUpdates";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/user";
import type { CashierOrderQuery, CashierPaymentResponse } from "@/types/cashier";
import type { MyMenuCategoryResponse, MyMenuItemResponse, MyTableResponse } from "@/types/me";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

type CashierView = "orders" | "tables" | "create" | "history" | "report";

type CashierCartItem = {
  menuItem: MyMenuItemResponse;
  qty: number;
};

const NAV_ITEMS: Array<{
  key: CashierView;
  label: string;
  mobileLabel: string;
  icon: ReactNode;
}> = [
  { key: "orders", label: "Quan ly don", mobileLabel: "Don", icon: <ReceiptText className="size-5" /> },
  { key: "tables", label: "So do ban", mobileLabel: "Ban", icon: <Grid2x2 className="size-5" /> },
  { key: "create", label: "Tao don moi", mobileLabel: "Tao", icon: <PlusCircle className="size-5" /> },
  { key: "history", label: "Lich su GD", mobileLabel: "Su", icon: <History className="size-5" /> },
  { key: "report", label: "Bao cao", mobileLabel: "Bao cao", icon: <MonitorDot className="size-5" /> },
];

const EMPTY_ORDERS: OwnerTableOrderHistoryResponse[] = [];
const EMPTY_TABLES: MyTableResponse[] = [];
const EMPTY_MENU_CATEGORIES: MyMenuCategoryResponse[] = [];

const getOrderStatusMeta = (status: string) => {
  const map: Record<string, { label: string; className: string }> = {
    PendingConfirmation: { label: "Cho xac nhan", className: "bg-amber-100 text-amber-700" },
    Confirmed: { label: "Da xac nhan", className: "bg-blue-100 text-blue-700" },
    Preparing: { label: "Dang lam", className: "bg-orange-100 text-orange-700" },
    PartiallyReady: { label: "Len 1 phan", className: "bg-lime-100 text-lime-700" },
    ReadyToServe: { label: "San sang", className: "bg-emerald-100 text-emerald-700" },
    PartiallyServed: { label: "Da phuc vu 1 phan", className: "bg-slate-100 text-slate-700" },
    Served: { label: "Da phuc vu", className: "bg-slate-100 text-slate-700" },
    Completed: { label: "Hoan thanh", className: "bg-emerald-100 text-emerald-700" },
    Cancelled: { label: "Da huy", className: "bg-rose-100 text-rose-700" },
  };

  return map[status] ?? { label: status, className: "bg-slate-100 text-slate-700" };
};

const getPaymentMeta = (order?: OwnerTableOrderHistoryResponse | null) => {
  if (!order?.paymentStatus) {
    return { label: "Chua thanh toan", className: "bg-slate-100 text-slate-600" };
  }

  if (order.paymentStatus === "SUCCESS") {
    return {
      label: `${order.paymentMethod ?? "Payment"} - Thanh cong`,
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  if (order.paymentStatus === "PENDING") {
    return {
      label: `${order.paymentMethod ?? "Payment"} - Dang cho`,
      className: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: `${order.paymentMethod ?? "Payment"} - ${order.paymentStatus}`,
    className: "bg-rose-100 text-rose-700",
  };
};

const getPaymentLabel = (order?: OwnerTableOrderHistoryResponse | null) => {
  if (!order?.paymentStatus) {
    return "No payment";
  }

  return order.paymentMethod ? `${order.paymentMethod} - ${order.paymentStatus}` : order.paymentStatus;
};

const getTableState = (table: MyTableResponse) => {
  if (table.status === "DISABLED") {
    return "disabled";
  }

  return table.currentSession ? "occupied" : "available";
};

const getOrderCreatedMinutes = (createdAt: string) => {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  return Math.max(Math.floor(diffMs / 60000), 0);
};

const getBranchName = (branchId: string | undefined, branches: Array<{ branchId: string; name: string }>) =>
  branches.find((branch) => branch.branchId === branchId)?.name ?? "-";

const printReceipt = (order: OwnerTableOrderHistoryResponse, payOsPayment?: CashierPaymentResponse | null) => {
  const receipt = window.open("", "_blank", "width=420,height=720");
  if (!receipt) {
    return;
  }

  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td>${item.menuItemName} x${item.quantity}</td>
          <td style="text-align:right">${formatCurrency(item.subTotal)}</td>
        </tr>
      `,
    )
    .join("");
  const qrImageSrc =
    payOsPayment?.paymentMethod === "PAYOS"
      ? getQrImageSrc(payOsPayment.qrCode, payOsPayment.checkoutUrl)
      : null;

  receipt.document.write(`
    <html>
      <head>
        <title>Receipt ${order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { font-size: 20px; margin: 0 0 8px; }
          p { margin: 4px 0; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          td { border-bottom: 1px solid #ddd; padding: 8px 0; font-size: 13px; }
          .total { font-size: 18px; font-weight: 800; display: flex; justify-content: space-between; margin-top: 16px; }
        </style>
      </head>
      <body>
        <h1>ScanNow Receipt</h1>
        <p>Order: ${order.orderNumber}</p>
        <p>Table: ${order.tableNumber ?? "-"}</p>
        <p>Session: ${order.sessionCode ?? "-"}</p>
        <p>Date: ${formatDateTime(order.createdAt)}</p>
        <table>${rows}</table>
        <p>Subtotal: ${formatCurrency(order.subTotal)}</p>
        <p>VAT: ${formatCurrency(order.vatAmount)}</p>
        <p>Service charge: ${formatCurrency(order.serviceChargeAmount)}</p>
        ${order.discountAmount > 0 ? `<p>Discount: -${formatCurrency(order.discountAmount)}</p>` : ""}
        <div class="total"><span>Total</span><span>${formatCurrency(order.totalAmount)}</span></div>
        <p>Payment: ${getPaymentLabel(order)}</p>
        ${
          order.paymentMethod === "CASH" && order.paymentStatus === "SUCCESS"
            ? `<p>Cash received: ${formatCurrency(order.amountReceived ?? order.totalAmount)}</p><p>Change: ${formatCurrency(order.changeAmount ?? 0)}</p>`
            : ""
        }
        ${
          qrImageSrc
            ? `<div style="margin-top:16px;text-align:center"><p style="font-weight:700">PayOS QR</p><img src="${qrImageSrc}" alt="PayOS QR" style="width:220px;height:220px;padding:8px;background:white" /><p>${payOsPayment?.description ?? ""}</p></div>`
            : ""
        }
      </body>
    </html>
  `);
  receipt.document.close();
  receipt.focus();
  receipt.print();
};

const CashierPill = ({
  label,
  className,
}: {
  label: string;
  className: string;
}) => <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold", className)}>{label}</span>;

const SectionCard = ({ className, children }: { className?: string; children: ReactNode }) => (
  <section className={cn("rounded-2xl border border-[#e8e4dc] bg-white shadow-sm", className)}>{children}</section>
);

const EmptyState = ({ title, detail }: { title: string; detail: string }) => (
  <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center text-stone-400">
    <ReceiptText className="mb-3 size-12" />
    <p className="text-sm font-semibold text-stone-600">{title}</p>
    <p className="mt-1 text-xs">{detail}</p>
  </div>
);

export const CashierDashboardPage = () => {
  const currentUser = useUserStore((state) => state.user);
  const branchesQuery = useMyBranchesListQuery();
  const branches = branchesQuery.data ?? [];

  const [currentView, setCurrentView] = useState<CashierView>("orders");
  const [branchId, setBranchId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [amountReceivedInput, setAmountReceivedInput] = useState("");
  const [payOsPayment, setPayOsPayment] = useState<CashierPaymentResponse | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cartItems, setCartItems] = useState<CashierCartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [clock, setClock] = useState(() => new Date());

  const activeBranchId = branchId || branches[0]?.branchId;
  const search = useDebounce(searchInput.trim(), 250);
  const debouncedCategorySearch = useDebounce(categorySearch.trim(), 200);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setPageNumber(1);
  }, [currentView, search]);

  const listStatus: NonNullable<CashierOrderQuery["status"]> =
    currentView === "history" ? "paid" : currentView === "report" ? "all" : "active";

  const listQuery = useMemo<CashierOrderQuery>(
    () => ({
      pageNumber,
      pageSize,
      search: search || undefined,
      status: listStatus,
      sortBy: currentView === "history" ? "paidAt" : "createdAt",
      sortDirection: "desc",
    }),
    [currentView, listStatus, pageNumber, pageSize, search],
  );

  const activeOrdersQuery = useCashierOrdersQuery(
    activeBranchId,
    {
      pageNumber: 1,
      pageSize: 100,
      status: "active",
      sortBy: "createdAt",
      sortDirection: "desc",
    },
    Boolean(activeBranchId),
  );
  const listOrdersQuery = useCashierOrdersQuery(activeBranchId, listQuery, Boolean(activeBranchId));
  const reportOrdersQuery = useCashierOrdersQuery(
    activeBranchId,
    {
      pageNumber: 1,
      pageSize: 100,
      status: "all",
      sortBy: "createdAt",
      sortDirection: "desc",
    },
    Boolean(activeBranchId) && currentView === "report",
  );
  const tablesQuery = useMyBranchTablesQuery(
    activeBranchId,
    { pageNumber: 1, pageSize: 100, sortBy: "tableNumber", sortDirection: "asc" },
    Boolean(activeBranchId),
  );
  const menuQuery = useMyBranchMenuQuery(
    activeBranchId,
    { pageNumber: 1, pageSize: 100, sortBy: "displayOrder", sortDirection: "asc" },
    Boolean(activeBranchId),
  );

  const checkoutMutation = useCashierCheckoutMutation();
  const cancelPaymentMutation = useCashierCancelPaymentMutation();
  const createOrderMutation = useCreateWaiterOrderMutation();
  const openTableMutation = useOpenMyTableSessionMutation();
  const closeTableMutation = useCloseMyTableSessionMutation();

  const refreshCashierData = useCallback(async () => {
    await Promise.all([
      activeOrdersQuery.refetch(),
      listOrdersQuery.refetch(),
      tablesQuery.refetch(),
    ]);
  }, [activeOrdersQuery, listOrdersQuery, tablesQuery]);

  useBranchOrderUpdates(activeBranchId, {
    enabled: Boolean(activeBranchId),
    onOrderUpdated: refreshCashierData,
  });

  const activeOrders = useMemo(
    () => activeOrdersQuery.data?.items ?? EMPTY_ORDERS,
    [activeOrdersQuery.data?.items],
  );
  const listOrders = useMemo(
    () => listOrdersQuery.data?.items ?? EMPTY_ORDERS,
    [listOrdersQuery.data?.items],
  );
  const reportOrders = useMemo(
    () => reportOrdersQuery.data?.items ?? EMPTY_ORDERS,
    [reportOrdersQuery.data?.items],
  );
  const tables = useMemo(() => tablesQuery.data?.items ?? EMPTY_TABLES, [tablesQuery.data?.items]);
  const menuCategories = useMemo(
    () => menuQuery.data?.items ?? EMPTY_MENU_CATEGORIES,
    [menuQuery.data?.items],
  );

  const menuItems = useMemo(() => {
    const flattened = menuCategories.flatMap((category: MyMenuCategoryResponse) =>
      category.items.map((item) => ({
        ...item,
        categoryName: category.categoryName,
      })),
    );

    return flattened.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.categoryId === activeCategory || item.categoryName === activeCategory;
      const matchesSearch =
        !debouncedCategorySearch ||
        item.name.toLowerCase().includes(debouncedCategorySearch.toLowerCase()) ||
        (item.description ?? "").toLowerCase().includes(debouncedCategorySearch.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, debouncedCategorySearch, menuCategories]);

  const categoryOptions = useMemo(
    () =>
      menuCategories.map((category) => ({
        id: category.categoryId,
        name: category.categoryName,
      })),
    [menuCategories],
  );

  const orderLookup = useMemo(() => {
    const map = new Map<string, OwnerTableOrderHistoryResponse>();
    [...activeOrders, ...listOrders, ...reportOrders].forEach((order) => map.set(order.orderId, order));
    return map;
  }, [activeOrders, listOrders, reportOrders]);

  const visibleOrders = currentView === "history" ? listOrders : currentView === "orders" ? listOrders : activeOrders;

  useEffect(() => {
    if (!visibleOrders.length) {
      setSelectedOrderId(null);
      return;
    }

    if (!selectedOrderId || !visibleOrders.some((order) => order.orderId === selectedOrderId)) {
      setSelectedOrderId(visibleOrders[0].orderId);
    }
  }, [selectedOrderId, visibleOrders]);

  const selectedOrder =
    (selectedOrderId ? orderLookup.get(selectedOrderId) ?? null : null) ??
    visibleOrders[0] ??
    activeOrders[0] ??
    null;

  const amountReceived = Number(amountReceivedInput);
  const cashChange =
    selectedOrder && Number.isFinite(amountReceived) ? amountReceived - selectedOrder.totalAmount : 0;
  const canConfirmCash = Boolean(
    selectedOrder && Number.isFinite(amountReceived) && amountReceived >= selectedOrder.totalAmount,
  );

  const hasPendingPayOs =
    selectedOrder?.paymentMethod === "PAYOS" && selectedOrder.paymentStatus === "PENDING";
  const activePayOsPayment =
    hasPendingPayOs && payOsPayment?.orderId === selectedOrder?.orderId ? payOsPayment : null;

  const totalPages = Math.max(listOrdersQuery.data?.totalPages ?? 1, 1);
  const visibleTotal = visibleOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const needPaymentCount = activeOrders.filter((order) => order.paymentStatus !== "SUCCESS").length;
  const paidCount = reportOrders.filter((order) => order.paymentStatus === "SUCCESS").length;
  const paidRevenue = reportOrders
    .filter((order) => order.paymentStatus === "SUCCESS")
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingRevenue = reportOrders
    .filter((order) => order.paymentStatus !== "SUCCESS")
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const averageTicket = paidCount > 0 ? paidRevenue / paidCount : 0;

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.menuItem.price * item.qty, 0),
    [cartItems],
  );

  const selectedTable = tables.find((table) => table.tableId === selectedTableId) ?? null;
  const selectedTableOrders = selectedTable
    ? activeOrders.filter((order) => order.tableId === selectedTable.tableId)
    : [];

  const setView = (view: CashierView) => {
    setCurrentView(view);
    if (view !== "create") {
      setCategorySearch("");
      setActiveCategory("all");
    }
  };

  const setCreateModeForTable = (tableId: string | null) => {
    setSelectedTableId(tableId);
    setCartItems([]);
    setCustomerName("");
    setCustomerNote("");
    setActiveCategory("all");
    setCategorySearch("");
    setView("create");
  };

  const checkout = async (paymentMethod: "CASH" | "PAYOS", amountReceivedValue?: number) => {
    if (!selectedOrder || !activeBranchId) {
      return;
    }

    const response = await checkoutMutation.mutateAsync({
      branchId: activeBranchId,
      orderId: selectedOrder.orderId,
      request: {
        paymentMethod,
        voucherCode: voucherCode.trim() || null,
        amountReceived: paymentMethod === "CASH" ? amountReceivedValue : null,
      },
    });

    setVoucherCode("");
    setAmountReceivedInput("");
    setCashDialogOpen(false);
    setSelectedOrderId(response.result.order.orderId);
    setPayOsPayment(response.result.paymentMethod === "PAYOS" ? response.result : null);
    await refreshCashierData();
  };

  const openCashDialog = () => {
    if (!selectedOrder || hasPendingPayOs) {
      return;
    }

    setAmountReceivedInput(String(selectedOrder.totalAmount));
    setCashDialogOpen(true);
  };

  const confirmCashPayment = async () => {
    if (!canConfirmCash) {
      return;
    }

    await checkout("CASH", amountReceived);
  };

  const cancelCashierPayment = async () => {
    if (!selectedOrder || !activeBranchId) {
      return;
    }

    const response = await cancelPaymentMutation.mutateAsync({
      branchId: activeBranchId,
      orderId: selectedOrder.orderId,
    });

    setPayOsPayment(null);
    setSelectedOrderId(response.result.orderId);
    await refreshCashierData();
  };

  const addToCart = (menuItem: MyMenuItemResponse) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.menuItem.menuItemId === menuItem.menuItemId);
      if (existing) {
        return prev.map((item) =>
          item.menuItem.menuItemId === menuItem.menuItemId ? { ...item, qty: item.qty + 1 } : item,
        );
      }

      return [...prev, { menuItem, qty: 1 }];
    });
  };

  const updateCartQty = (menuItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.menuItem.menuItemId === menuItemId ? { ...item, qty: item.qty + delta } : item,
        )
        .filter((item) => item.qty > 0),
    );
  };

  const submitManualOrder = async () => {
    if (!activeBranchId || !selectedTableId || cartItems.length === 0) {
      return;
    }

    const table = tables.find((item) => item.tableId === selectedTableId);
    if (!table) {
      return;
    }

    if (!table.currentSession) {
      await openTableMutation.mutateAsync({ branchId: activeBranchId, tableId: table.tableId });
    }

    const response = await createOrderMutation.mutateAsync({
      branchId: activeBranchId,
      request: {
        tableId: selectedTableId,
        customerName: customerName.trim() || null,
        customerNote: customerNote.trim() || null,
        items: cartItems.map((item) => ({
          menuItemId: item.menuItem.menuItemId,
          quantity: item.qty,
          note: null,
        })),
      },
    });

    setCartItems([]);
    setCustomerName("");
    setCustomerNote("");
    setSelectedOrderId(response.result.orderId);
    setPayOsPayment(null);
    setView("orders");
    await refreshCashierData();
  };

  const closeTable = async (table: MyTableResponse) => {
    if (!table.currentSession) {
      return;
    }

    await closeTableMutation.mutateAsync(table.currentSession.sessionId);
    await tablesQuery.refetch();
  };

  const openTable = async (table: MyTableResponse) => {
    if (!activeBranchId) {
      return;
    }

    await openTableMutation.mutateAsync({ branchId: activeBranchId, tableId: table.tableId });
    await tablesQuery.refetch();
  };

  const renderHeaderTitle = () => {
    if (currentView === "orders") {
      return "Quan ly don hang";
    }
    if (currentView === "tables") {
      return "So do ban";
    }
    if (currentView === "create") {
      return "Tao don moi";
    }
    if (currentView === "history") {
      return "Lich su giao dich";
    }
    return "Bao cao ca";
  };

  const showDetailedToolbar = currentView === "orders" || currentView === "history";
  const showCompactToolbar = currentView === "tables" || currentView === "create";

  return (
    <div className="min-h-screen bg-[#f8f7f4] font-sans text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[88px] shrink-0 border-r border-[#e8e4dc] bg-white md:flex lg:w-[240px]">
          <div className="flex h-full w-full flex-col justify-between px-4 py-6">
            <div>
              <div className="mb-8 flex items-center justify-center gap-3 lg:justify-start">
                <div className="bg-primary shadow-primary/20 flex size-10 items-center justify-center rounded-2xl text-white shadow-lg">
                  <ReceiptText className="size-5" />
                </div>
                <div className="hidden lg:block">
                  <p className="text-lg font-black tracking-tight">ScanNow</p>
                  <p className="text-primary text-[11px] font-bold tracking-[0.24em] uppercase">Cashier</p>
                </div>
              </div>

              <nav className="space-y-2">
                {NAV_ITEMS.map((item) => {
                  const active = currentView === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setView(item.key)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                        active ? "bg-primary/10 text-primary" : "text-stone-500 hover:bg-stone-50",
                      )}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="hidden lg:inline">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="rounded-2xl border border-[#e8e4dc] bg-stone-50 px-3 py-3">
              <p className="truncate text-sm font-bold">{currentUser?.fullName ?? "Cashier"}</p>
              <p className="mt-1 text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
                {getBranchName(activeBranchId, branches)}
              </p>
            </div>
          </div>
        </aside>

        <main className="flex min-h-screen flex-1 flex-col pb-20 md:pb-0">
          <header className="sticky top-0 z-30 border-b border-[#e8e4dc] bg-white/95 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 md:px-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.22em] text-stone-500 uppercase">Cashier workspace</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight">{renderHeaderTitle()}</h1>
                <p className="mt-1 text-sm text-stone-500">
                  {getBranchName(activeBranchId, branches)} · {clock.toLocaleDateString("vi-VN")}
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-2 rounded-full border border-[#e8e4dc] bg-stone-50 px-3 py-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-bold tracking-[0.22em] text-stone-700 uppercase">Online</span>
                </div>

                <div className="rounded-2xl border border-[#e8e4dc] bg-white px-4 py-2 text-right shadow-sm">
                  <p className="font-mono text-sm font-bold">{clock.toLocaleTimeString("vi-VN")}</p>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
                    {currentUser?.fullName ?? "Cashier"}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-4">
              {showDetailedToolbar ? (
                <SectionCard className="p-4">
                  <div className="grid gap-3 lg:grid-cols-[240px_minmax(260px,1fr)_auto]">
                    <select
                      value={activeBranchId ?? ""}
                      onChange={(event) => {
                        setBranchId(event.target.value);
                        setSelectedOrderId(null);
                        setSelectedTableId(null);
                      }}
                      className="h-11 rounded-xl border border-[#e8e4dc] bg-white px-3 text-sm font-semibold outline-none"
                    >
                      {branches.map((branch) => (
                        <option key={branch.branchId} value={branch.branchId}>
                          {branch.name}
                        </option>
                      ))}
                    </select>

                    <label className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
                      <Input
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder={
                          currentView === "history"
                            ? "Tim order da thanh toan, ban, session"
                            : "Tim order, ban, session, khach"
                        }
                        className="h-11 rounded-xl border-[#e8e4dc] pl-10"
                      />
                    </label>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl"
                      onClick={() => refreshCashierData()}
                      disabled={activeOrdersQuery.isFetching || listOrdersQuery.isFetching}
                    >
                      {activeOrdersQuery.isFetching || listOrdersQuery.isFetching ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      Refresh
                    </Button>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <MetricCard
                      label="Don hien thi"
                      value={String(visibleOrders.length)}
                      helper="Theo bo loc hien tai"
                    />
                    <MetricCard label="Can thu" value={String(needPaymentCount)} helper="Don chua thanh toan" />
                    <MetricCard
                      label="Tong tien"
                      value={formatCurrency(visibleTotal)}
                      helper="Tong tren danh sach"
                    />
                  </div>
                </SectionCard>
              ) : null}

              {showCompactToolbar ? (
                <SectionCard className="p-4">
                  <div className="grid gap-3 md:grid-cols-[240px_minmax(0,1fr)_auto]">
                    <select
                      value={activeBranchId ?? ""}
                      onChange={(event) => {
                        setBranchId(event.target.value);
                        setSelectedOrderId(null);
                        setSelectedTableId(null);
                      }}
                      className="h-11 rounded-xl border border-[#e8e4dc] bg-white px-3 text-sm font-semibold outline-none"
                    >
                      {branches.map((branch) => (
                        <option key={branch.branchId} value={branch.branchId}>
                          {branch.name}
                        </option>
                      ))}
                    </select>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <MetricCard label="Can thu" value={String(needPaymentCount)} helper="Order chua thu tien" />
                      <MetricCard label="Active" value={String(activeOrders.length)} helper="Order dang mo" />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl"
                      onClick={() => refreshCashierData()}
                      disabled={activeOrdersQuery.isFetching || tablesQuery.isFetching}
                    >
                      {activeOrdersQuery.isFetching || tablesQuery.isFetching ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </SectionCard>
              ) : null}

              {currentView === "orders" ? (
                <section className="grid gap-4 xl:grid-cols-[360px_minmax(320px,1fr)_400px]">
                  <OrdersListPanel
                    orders={listOrders}
                    isLoading={listOrdersQuery.isLoading}
                    isError={listOrdersQuery.isError}
                    error={listOrdersQuery.error}
                    selectedOrderId={selectedOrderId}
                    onSelectOrder={setSelectedOrderId}
                  />

                  <OrderDetailPanel
                    order={selectedOrder}
                    onAddItems={() => setCreateModeForTable(selectedOrder?.tableId ?? null)}
                    onOpenTableOrder={() => setView("tables")}
                  />

                  <PaymentPanel
                    order={selectedOrder}
                    voucherCode={voucherCode}
                    onVoucherChange={setVoucherCode}
                    activePayOsPayment={activePayOsPayment}
                    hasPendingPayOs={hasPendingPayOs}
                    isCheckingOut={checkoutMutation.isPending}
                    isCanceling={cancelPaymentMutation.isPending}
                    onCash={openCashDialog}
                    onPayOs={() => checkout("PAYOS")}
                    onCancelPayOs={cancelCashierPayment}
                    onPrint={() => selectedOrder && printReceipt(selectedOrder, activePayOsPayment)}
                  />
                </section>
              ) : null}

              {currentView === "tables" ? (
                <TablesPanel
                  tables={tables}
                  activeOrders={activeOrders}
                  isLoading={tablesQuery.isLoading || activeOrdersQuery.isLoading}
                  onCollect={(orderId) => {
                    setSelectedOrderId(orderId);
                    setView("orders");
                  }}
                  onCreate={setCreateModeForTable}
                  onOpenTable={openTable}
                  onCloseTable={closeTable}
                  openTablePending={openTableMutation.isPending}
                  closeTablePending={closeTableMutation.isPending}
                />
              ) : null}

              {currentView === "create" ? (
                <CreateOrderPanel
                  tables={tables}
                  selectedTable={selectedTable}
                  selectedTableOrders={selectedTableOrders}
                  onSelectTable={setSelectedTableId}
                  menuItems={menuItems}
                  categories={categoryOptions}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  search={categorySearch}
                  onSearchChange={setCategorySearch}
                  cartItems={cartItems}
                  onAddToCart={addToCart}
                  onUpdateQty={updateCartQty}
                  cartTotal={cartTotal}
                  customerName={customerName}
                  onCustomerNameChange={setCustomerName}
                  customerNote={customerNote}
                  onCustomerNoteChange={setCustomerNote}
                  onSubmit={submitManualOrder}
                  isSubmitting={createOrderMutation.isPending || openTableMutation.isPending}
                />
              ) : null}

              {currentView === "history" ? (
                <HistoryPanel
                  orders={listOrders}
                  selectedOrderId={selectedOrderId}
                  onSelectOrder={setSelectedOrderId}
                  selectedOrder={selectedOrder}
                  isLoading={listOrdersQuery.isLoading}
                  isError={listOrdersQuery.isError}
                  error={listOrdersQuery.error}
                  onPrint={() => selectedOrder && printReceipt(selectedOrder, null)}
                />
              ) : null}

              {currentView === "report" ? (
                <ReportPanel
                  orders={reportOrders}
                  isLoading={reportOrdersQuery.isLoading}
                  revenue={paidRevenue}
                  pendingRevenue={pendingRevenue}
                  paidCount={paidCount}
                  averageTicket={averageTicket}
                />
              ) : null}

              {currentView === "orders" || currentView === "history" ? (
                <FooterPagination
                  page={pageNumber}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  pageSizeOptions={[10]}
                  totalItems={listOrdersQuery.data?.totalItems ?? 0}
                  itemLabel="orders"
                  mode="numbers"
                  disabled={listOrdersQuery.isFetching}
                  onPageChange={setPageNumber}
                  onPageSizeChange={(nextPageSize) => {
                    setPageSize(nextPageSize);
                    setPageNumber(1);
                  }}
                />
              ) : null}
            </div>
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8e4dc] bg-white/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const active = currentView === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-semibold transition-colors",
                  active ? "text-primary" : "text-stone-500",
                )}
              >
                {item.icon}
                <span>{item.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <Dialog open={cashDialogOpen} onOpenChange={setCashDialogOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Cash payment</DialogTitle>
            <DialogDescription>Enter the amount received from the customer before completing payment.</DialogDescription>
          </DialogHeader>
          {selectedOrder ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-stone-50 p-4 text-sm">
                <div className="flex justify-between py-1">
                  <span>Order total</span>
                  <strong>{formatCurrency(selectedOrder.totalAmount)}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>Change</span>
                  <strong className={cashChange < 0 ? "text-red-600" : "text-emerald-700"}>
                    {formatCurrency(Math.max(cashChange, 0))}
                  </strong>
                </div>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Amount received</span>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={amountReceivedInput}
                  onChange={(event) => setAmountReceivedInput(event.target.value)}
                  className="h-12 text-lg font-bold"
                  autoFocus
                />
              </label>
              {amountReceivedInput && !canConfirmCash ? (
                <p className="text-sm text-red-600">Amount received must be at least the order total.</p>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCashDialogOpen(false)} disabled={checkoutMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={confirmCashPayment} disabled={!canConfirmCash || checkoutMutation.isPending}>
              <Wallet className="size-4" />
              Confirm cash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function MetricCard({
  label,
  value,
  helper,
  className,
}: {
  label: string;
  value: string;
  helper: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-[#e8e4dc] bg-stone-50 px-4 py-3", className)}>
      <p className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase">{label}</p>
      <p className="mt-2 text-lg font-black tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{helper}</p>
    </div>
  );
}

function OrdersListPanel({
  orders,
  isLoading,
  isError,
  error,
  selectedOrderId,
  onSelectOrder,
}: {
  orders: OwnerTableOrderHistoryResponse[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
}) {
  return (
    <SectionCard className="flex min-h-[520px] flex-col overflow-hidden">
      <div className="border-b border-[#e8e4dc] bg-stone-50/70 px-4 py-4">
        <p className="text-sm font-black">Danh sach don</p>
        <p className="mt-1 text-xs text-stone-500">Chon order de xem chi tiet va thanh toan.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center gap-3 px-3 py-5 text-sm">
            <Spinner className="size-5 text-blue-600" />
            <span>Loading cashier orders...</span>
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {getOwnerTableErrorMessage(error, "Unable to load cashier orders.")}
          </div>
        ) : null}

        {!isLoading && !isError && orders.length === 0 ? (
          <EmptyState title="Khong co order phu hop" detail="Thu doi bo loc hoac branch." />
        ) : null}

        <div className="space-y-2">
          {orders.map((order) => {
            const statusMeta = getOrderStatusMeta(order.status);
            const paymentMeta = getPaymentMeta(order);
            const active = selectedOrderId === order.orderId;
            const minutes = getOrderCreatedMinutes(order.createdAt);

            return (
              <button
                key={order.orderId}
                type="button"
                onClick={() => onSelectOrder(order.orderId)}
                className={cn(
                  "w-full rounded-2xl border bg-white p-4 text-left transition-all",
                  active
                    ? "border-blue-200 bg-blue-50/70 shadow-sm"
                    : "border-[#e8e4dc] hover:border-blue-200 hover:bg-stone-50",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black tracking-tight text-stone-900">{order.tableNumber ?? "TA"}</span>
                      <span className="text-xs font-semibold text-stone-400">{order.orderNumber}</span>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      {order.sessionCode ?? "No session"} · {minutes}m
                    </p>
                  </div>
                  <CashierPill label={statusMeta.label} className={statusMeta.className} />
                </div>

                <div className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-600">
                  {order.items.slice(0, 2).map((item) => `${item.menuItemName} x${item.quantity}`).join(", ")}
                  {order.items.length > 2 ? "..." : ""}
                </div>

                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="space-y-1">
                    <CashierPill label={paymentMeta.label} className={paymentMeta.className} />
                    <p className="text-xs text-stone-500">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <p className="text-lg font-black text-orange-600">{formatCurrency(order.totalAmount)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}

function OrderDetailPanel({
  order,
  onAddItems,
  onOpenTableOrder,
}: {
  order: OwnerTableOrderHistoryResponse | null;
  onAddItems: () => void;
  onOpenTableOrder: () => void;
}) {
  if (!order) {
    return (
      <SectionCard>
        <EmptyState title="Chua chon order" detail="Chon mot order o cot ben trai de xem chi tiet." />
      </SectionCard>
    );
  }

  const statusMeta = getOrderStatusMeta(order.status);

  return (
    <SectionCard className="flex min-h-[520px] flex-col overflow-hidden">
      <div className="border-b border-[#e8e4dc] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight">{order.tableNumber ?? "Takeaway"}</h2>
              <CashierPill label={statusMeta.label} className={statusMeta.className} />
            </div>
            <p className="mt-1 text-sm text-stone-500">
              {order.orderNumber} · Session {order.sessionCode ?? "-"} · {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="flex gap-2">
            {order.tableId ? (
              <Button type="button" variant="outline" className="rounded-xl" onClick={onAddItems}>
                <PlusCircle className="size-4" />
                Add items
              </Button>
            ) : null}
            <Button type="button" variant="outline" className="rounded-xl" onClick={onOpenTableOrder}>
              <Table2 className="size-4" />
              Tables
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-stone-50/50 p-4">
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.orderItemId} className="rounded-2xl border border-[#ebe7df] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{item.menuItemName}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Qty {item.quantity} · {formatCurrency(item.unitPrice)}
                  </p>
                  {item.note ? <p className="mt-2 text-xs text-orange-600 italic">{item.note}</p> : null}
                </div>
                <p className="text-sm font-black">{formatCurrency(item.subTotal)}</p>
              </div>
            </div>
          ))}
        </div>

        {order.customerName || order.customerNote ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {order.customerName ? <p className="font-bold">Customer: {order.customerName}</p> : null}
            {order.customerNote ? <p className="mt-1">{order.customerNote}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#e8e4dc] bg-white px-5 py-4">
        <div className="space-y-2 text-sm">
          <SummaryRow label="Subtotal" value={formatCurrency(order.subTotal)} />
          <SummaryRow label="VAT" value={formatCurrency(order.vatAmount)} />
          <SummaryRow label="Service" value={formatCurrency(order.serviceChargeAmount)} />
          {order.discountAmount > 0 ? (
            <SummaryRow label="Discount" value={`-${formatCurrency(order.discountAmount)}`} valueClassName="text-emerald-700" />
          ) : null}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-dashed border-[#e8e4dc] pt-3">
          <span className="text-sm font-bold tracking-[0.18em] text-stone-500 uppercase">Tong cong</span>
          <span className="text-2xl font-black text-blue-600">{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
    </SectionCard>
  );
}

function PaymentPanel({
  order,
  voucherCode,
  onVoucherChange,
  activePayOsPayment,
  hasPendingPayOs,
  isCheckingOut,
  isCanceling,
  onCash,
  onPayOs,
  onCancelPayOs,
  onPrint,
}: {
  order: OwnerTableOrderHistoryResponse | null;
  voucherCode: string;
  onVoucherChange: (value: string) => void;
  activePayOsPayment: CashierPaymentResponse | null;
  hasPendingPayOs: boolean;
  isCheckingOut: boolean;
  isCanceling: boolean;
  onCash: () => void;
  onPayOs: () => void;
  onCancelPayOs: () => void;
  onPrint: () => void;
}) {
  if (!order) {
    return (
      <SectionCard>
        <EmptyState title="Chua co thanh toan" detail="Chon order de xu ly cash hoac PayOS." />
      </SectionCard>
    );
  }

  const paymentMeta = getPaymentMeta(order);

  return (
    <SectionCard className="flex min-h-[520px] flex-col overflow-hidden">
      <div className="border-b border-[#e8e4dc] px-5 py-4">
        <p className="text-xl font-black">Thanh toan</p>
        <p className="mt-1 text-sm text-stone-500">
          {order.orderNumber} · Table {order.tableNumber ?? "-"}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="rounded-2xl border border-[#e8e4dc] bg-stone-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-500">Payment state</span>
            <CashierPill label={paymentMeta.label} className={paymentMeta.className} />
          </div>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-stone-500 uppercase">Tong thu</p>
              <p className="mt-1 text-3xl font-black text-orange-600">{formatCurrency(order.totalAmount)}</p>
            </div>
            <Button type="button" variant="soft" className="rounded-xl" onClick={onPrint}>
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </div>

        {order.paymentMethod === "CASH" && order.paymentStatus === "SUCCESS" ? (
          <div className="rounded-2xl border border-[#e8e4dc] bg-white p-4 text-sm">
            <SummaryRow
              label="Cash received"
              value={formatCurrency(order.amountReceived ?? order.totalAmount)}
            />
            <SummaryRow label="Change" value={formatCurrency(order.changeAmount ?? 0)} />
          </div>
        ) : null}

        {order.paymentStatus !== "SUCCESS" ? (
          <div className="space-y-3">
            <Input
              value={voucherCode}
              onChange={(event) => onVoucherChange(event.target.value)}
              placeholder="Voucher code (optional)"
              className="h-11 rounded-xl border-[#e8e4dc]"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onCash}
                disabled={isCheckingOut || hasPendingPayOs}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Wallet className="size-4" />
                Cash
              </button>
              <button
                type="button"
                onClick={onPayOs}
                disabled={isCheckingOut}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#e8e4dc] bg-white px-4 text-sm font-bold text-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCheckingOut ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                {hasPendingPayOs ? "Show PayOS QR" : "PayOS"}
              </button>
            </div>
            {hasPendingPayOs ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Don nay dang co PayOS pending. Muon doi sang cash thi huy QR truoc.
              </div>
            ) : null}
          </div>
        ) : null}

        {activePayOsPayment ? (
          <PayOsQrPanel
            qrCode={activePayOsPayment.qrCode}
            checkoutUrl={activePayOsPayment.checkoutUrl}
            amount={activePayOsPayment.amount ?? order.totalAmount}
            description={activePayOsPayment.description}
            accountName={activePayOsPayment.accountName}
            accountNumber={activePayOsPayment.accountNumber}
            bin={activePayOsPayment.bin}
            expiresAt={activePayOsPayment.paymentExpiresAt}
            onCancel={onCancelPayOs}
            cancelDisabled={isCanceling}
          />
        ) : null}
      </div>
    </SectionCard>
  );
}

function TablesPanel({
  tables,
  activeOrders,
  isLoading,
  onCollect,
  onCreate,
  onOpenTable,
  onCloseTable,
  openTablePending,
  closeTablePending,
}: {
  tables: MyTableResponse[];
  activeOrders: OwnerTableOrderHistoryResponse[];
  isLoading: boolean;
  onCollect: (orderId: string) => void;
  onCreate: (tableId: string | null) => void;
  onOpenTable: (table: MyTableResponse) => void;
  onCloseTable: (table: MyTableResponse) => void;
  openTablePending: boolean;
  closeTablePending: boolean;
}) {
  const [selectedTable, setSelectedTable] = useState<MyTableResponse | null>(null);
  const tableOrder = selectedTable
    ? activeOrders.find((order) => order.tableId === selectedTable.tableId) ?? null
    : null;

  return (
    <>
      <SectionCard className="overflow-hidden">
        <div className="border-b border-[#e8e4dc] px-5 py-4">
          <p className="text-xl font-black">So do ban</p>
          <p className="mt-1 text-sm text-stone-500">Ban trong, ban co khach, va luong thu tien ngay tai map.</p>
        </div>

        <div className="p-5">
          <div className="mb-5 flex flex-wrap gap-4 text-sm">
            <LegendDot color="bg-emerald-500" label="Trong" />
            <LegendDot color="bg-orange-500" label="Co khach" />
            <LegendDot color="bg-slate-400" label="Ngung dung" />
          </div>

          {isLoading ? (
            <div className="flex items-center gap-3 text-sm">
              <Spinner className="size-5 text-blue-600" />
              <span>Loading tables...</span>
            </div>
          ) : null}

          {!isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {tables.map((table) => {
                const state = getTableState(table);
                const order = activeOrders.find((item) => item.tableId === table.tableId) ?? null;
                const className =
                  state === "occupied"
                    ? "border-transparent bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : state === "disabled"
                      ? "border-transparent bg-slate-100 text-slate-400"
                      : "border-[#e8e4dc] bg-white text-stone-900";

                return (
                  <button
                    key={table.tableId}
                    type="button"
                    onClick={() => setSelectedTable(table)}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center rounded-3xl border-2 px-3 py-4 text-center transition-all hover:scale-[1.01]",
                      className,
                    )}
                  >
                    {order ? (
                      <span className="absolute top-2 right-2 rounded-full bg-black/10 px-2 py-1 text-[10px] font-bold">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    ) : null}
                    <span className="text-3xl font-black tracking-tight">{table.tableNumber}</span>
                    <span className="mt-2 text-xs font-semibold tracking-[0.18em] uppercase opacity-75">
                      {state === "occupied" ? "Dang phuc vu" : state === "available" ? `${table.capacity} cho` : "Ngung"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </SectionCard>

      {selectedTable ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelectedTable(null)} />
          <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-[420px] rounded-[28px] border border-[#e8e4dc] bg-white p-5 shadow-2xl md:bottom-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black">Ban {selectedTable.tableNumber}</h3>
                <p className="mt-1 text-sm text-stone-500">{selectedTable.capacity} cho</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-[#e8e4dc] p-2 text-stone-500"
                onClick={() => setSelectedTable(null)}
              >
                <XCircle className="size-4" />
              </button>
            </div>

            {tableOrder ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
                  <p className="text-xs font-bold tracking-[0.2em] text-orange-700 uppercase">Active order</p>
                  <p className="mt-2 text-lg font-black text-orange-700">{tableOrder.orderNumber}</p>
                  <p className="mt-1 text-sm text-orange-700">{formatCurrency(tableOrder.totalAmount)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onCollect(tableOrder.orderId);
                      setSelectedTable(null);
                    }}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-bold text-blue-700"
                  >
                    <Banknote className="size-4" />
                    Thu tien
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onCreate(selectedTable.tableId);
                      setSelectedTable(null);
                    }}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white"
                  >
                    <PlusCircle className="size-4" />
                    Them mon
                  </button>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await onCloseTable(selectedTable);
                    setSelectedTable(null);
                  }}
                  disabled={closeTablePending}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-100 text-sm font-bold text-stone-700 disabled:opacity-50"
                >
                  {closeTablePending ? <Loader2 className="size-4 animate-spin" /> : <Table2 className="size-4" />}
                  Dong ban
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    onCreate(selectedTable.tableId);
                    setSelectedTable(null);
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white"
                >
                  <PlusCircle className="size-4" />
                  Tao don moi
                </button>
                {!selectedTable.currentSession ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await onOpenTable(selectedTable);
                      setSelectedTable(null);
                    }}
                    disabled={openTablePending}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#e8e4dc] bg-white text-sm font-bold text-stone-700 disabled:opacity-50"
                  >
                    {openTablePending ? <Loader2 className="size-4 animate-spin" /> : <Table2 className="size-4" />}
                    Mo phien ban
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </>
      ) : null}
    </>
  );
}

function CreateOrderPanel({
  tables,
  selectedTable,
  selectedTableOrders,
  onSelectTable,
  menuItems,
  categories,
  activeCategory,
  onCategoryChange,
  search,
  onSearchChange,
  cartItems,
  onAddToCart,
  onUpdateQty,
  cartTotal,
  customerName,
  onCustomerNameChange,
  customerNote,
  onCustomerNoteChange,
  onSubmit,
  isSubmitting,
}: {
  tables: MyTableResponse[];
  selectedTable: MyTableResponse | null;
  selectedTableOrders: OwnerTableOrderHistoryResponse[];
  onSelectTable: (tableId: string | null) => void;
  menuItems: Array<MyMenuItemResponse & { categoryName?: string | null }>;
  categories: Array<{ id: string; name: string }>;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  cartItems: CashierCartItem[];
  onAddToCart: (item: MyMenuItemResponse) => void;
  onUpdateQty: (menuItemId: string, delta: number) => void;
  cartTotal: number;
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  customerNote: string;
  onCustomerNoteChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      <SectionCard className="overflow-hidden">
        <div className="border-b border-[#e8e4dc] px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xl font-black">Tao don thu cong</p>
              <p className="mt-1 text-sm text-stone-500">Cashier co the tao hoac them mon cho ban dang phuc vu.</p>
            </div>
            <select
              value={selectedTable?.tableId ?? ""}
              onChange={(event) => onSelectTable(event.target.value || null)}
              className="h-11 rounded-xl border border-[#e8e4dc] bg-white px-3 text-sm font-semibold outline-none"
            >
              <option value="">Chon ban</option>
              {tables
                .filter((table) => table.status !== "DISABLED")
                .map((table) => (
                  <option key={table.tableId} value={table.tableId}>
                    Ban {table.tableNumber} · {table.currentSession ? "Dang phuc vu" : "Trong"}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="border-b border-[#e8e4dc] bg-stone-50/70 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCategoryChange("all")}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold",
                activeCategory === "all" ? "bg-blue-600 text-white" : "bg-white text-stone-600",
              )}
            >
              Tat ca
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold",
                  activeCategory === category.id ? "bg-blue-600 text-white" : "bg-white text-stone-600",
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          <label className="relative mt-3 block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tim mon an..."
              className="h-11 rounded-xl border-[#e8e4dc] pl-10"
            />
          </label>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {menuItems.map((item) => {
            const cartItem = cartItems.find((cart) => cart.menuItem.menuItemId === item.menuItemId);

            return (
              <div key={item.menuItemId} className="rounded-3xl border border-[#ebe7df] bg-white p-4 shadow-sm">
                <div className="flex min-h-[80px] flex-col">
                  <p className="text-sm font-black">{item.name}</p>
                  <p className="mt-1 text-xs text-stone-500">{item.categoryName ?? "Menu item"}</p>
                  <p className="mt-auto pt-4 text-lg font-black text-blue-600">{formatCurrency(item.price)}</p>
                </div>

                <div className="mt-4">
                  {cartItem ? (
                    <div className="flex items-center justify-between rounded-2xl bg-blue-50 px-2 py-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.menuItemId, -1)}
                        className="flex size-9 items-center justify-center rounded-xl bg-white text-blue-600"
                      >
                        -
                      </button>
                      <span className="text-sm font-black text-blue-700">{cartItem.qty}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.menuItemId, 1)}
                        className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddToCart(item)}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 text-sm font-bold text-blue-700"
                    >
                      <PlusCircle className="size-4" />
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard className="flex flex-col overflow-hidden">
        <div className="border-b border-[#e8e4dc] px-5 py-4">
          <p className="text-xl font-black">Cart</p>
          <p className="mt-1 text-sm text-stone-500">
            {selectedTable ? `Ban ${selectedTable.tableNumber}` : "Chon ban de tao don"}
          </p>
        </div>

        {selectedTableOrders.length > 0 ? (
          <div className="border-b border-[#e8e4dc] bg-stone-50 px-5 py-3 text-sm text-stone-600">
            <p className="font-semibold">Ban nay dang co {selectedTableOrders.length} active order.</p>
            <p className="mt-1 text-xs">Mon moi se duoc them vao order dang hoat dong theo backend hien tai.</p>
          </div>
        ) : null}

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {cartItems.length === 0 ? (
            <EmptyState title="Cart dang trong" detail="Chon mon o ben trai de them vao don." />
          ) : (
            cartItems.map((item) => (
              <div key={item.menuItem.menuItemId} className="rounded-2xl border border-[#ebe7df] bg-stone-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{item.menuItem.name}</p>
                    <p className="mt-1 text-xs text-stone-500">{formatCurrency(item.menuItem.price)}</p>
                  </div>
                  <p className="text-sm font-black">{formatCurrency(item.menuItem.price * item.qty)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.menuItem.menuItemId, -1)}
                      className="flex size-8 items-center justify-center rounded-lg bg-white text-blue-600"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm font-black">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.menuItem.menuItemId, 1)}
                      className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[#e8e4dc] px-5 py-4">
          <div className="space-y-3">
            <Input
              value={customerName}
              onChange={(event) => onCustomerNameChange(event.target.value)}
              placeholder="Customer name (optional)"
              className="h-11 rounded-xl border-[#e8e4dc]"
            />
            <Input
              value={customerNote}
              onChange={(event) => onCustomerNoteChange(event.target.value)}
              placeholder="Customer note (optional)"
              className="h-11 rounded-xl border-[#e8e4dc]"
            />
            <div className="flex items-center justify-between border-t border-dashed border-[#e8e4dc] pt-3">
              <span className="text-sm font-bold tracking-[0.18em] text-stone-500 uppercase">Tong cong</span>
              <span className="text-2xl font-black text-orange-600">{formatCurrency(cartTotal)}</span>
            </div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!selectedTable || cartItems.length === 0 || isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              {selectedTableOrders.length > 0 ? "Them mon vao ban" : "Tao don moi"}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function HistoryPanel({
  orders,
  selectedOrderId,
  onSelectOrder,
  selectedOrder,
  isLoading,
  isError,
  error,
  onPrint,
}: {
  orders: OwnerTableOrderHistoryResponse[];
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  selectedOrder: OwnerTableOrderHistoryResponse | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onPrint: () => void;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[360px_minmax(320px,1fr)]">
      <OrdersListPanel
        orders={orders}
        isLoading={isLoading}
        isError={isError}
        error={error}
        selectedOrderId={selectedOrderId}
        onSelectOrder={onSelectOrder}
      />

      <SectionCard className="flex min-h-[520px] flex-col overflow-hidden">
        <div className="border-b border-[#e8e4dc] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xl font-black">Receipt history</p>
              <p className="mt-1 text-sm text-stone-500">Chi tiet giao dich da thu tien.</p>
            </div>
            {selectedOrder ? (
              <Button type="button" variant="soft" className="rounded-xl" onClick={onPrint}>
                <Printer className="size-4" />
                Reprint
              </Button>
            ) : null}
          </div>
        </div>

        {selectedOrder ? (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="rounded-2xl border border-[#e8e4dc] bg-stone-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black">{selectedOrder.orderNumber}</p>
                  <p className="mt-1 text-sm text-stone-500">
                    Table {selectedOrder.tableNumber ?? "-"} · {formatDateTime(selectedOrder.paidAt ?? selectedOrder.createdAt)}
                  </p>
                </div>
                <CashierPill
                  label={getPaymentMeta(selectedOrder).label}
                  className={getPaymentMeta(selectedOrder).className}
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {selectedOrder.items.map((item) => (
                <div key={item.orderItemId} className="flex items-start justify-between rounded-2xl border border-[#ebe7df] bg-white p-4">
                  <div>
                    <p className="text-sm font-bold">{item.menuItemName}</p>
                    <p className="mt-1 text-xs text-stone-500">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-black">{formatCurrency(item.subTotal)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="Chua chon giao dich" detail="Chon giao dich da thanh toan o danh sach ben trai." />
        )}
      </SectionCard>
    </section>
  );
}

function ReportPanel({
  orders,
  isLoading,
  revenue,
  pendingRevenue,
  paidCount,
  averageTicket,
}: {
  orders: OwnerTableOrderHistoryResponse[];
  isLoading: boolean;
  revenue: number;
  pendingRevenue: number;
  paidCount: number;
  averageTicket: number;
}) {
  const payOsCount = orders.filter((order) => order.paymentMethod === "PAYOS" && order.paymentStatus === "SUCCESS").length;
  const cashCount = orders.filter((order) => order.paymentMethod === "CASH" && order.paymentStatus === "SUCCESS").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Da thu" value={formatCurrency(revenue)} helper="Tong don thanh cong" />
        <MetricCard label="Dang cho" value={formatCurrency(pendingRevenue)} helper="Don chua thu xong" />
        <MetricCard label="Paid orders" value={String(paidCount)} helper="Tong giao dich da thu" />
        <MetricCard label="Avg ticket" value={formatCurrency(averageTicket)} helper="Gia tri trung binh" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard className="overflow-hidden">
          <div className="border-b border-[#e8e4dc] px-5 py-4">
            <p className="text-xl font-black">Recent activity</p>
            <p className="mt-1 text-sm text-stone-500">100 don gan nhat theo branch hien tai.</p>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center gap-3 p-5 text-sm">
                <Spinner className="size-5 text-blue-600" />
                <span>Loading report...</span>
              </div>
            ) : null}

            {!isLoading ? (
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs font-bold tracking-[0.18em] text-stone-500 uppercase">
                  <tr>
                    <th className="px-5 py-4">Order</th>
                    <th className="px-5 py-4">Table</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.orderId} className="border-t border-[#efeae3]">
                      <td className="px-5 py-4">
                        <p className="font-bold">{order.orderNumber}</p>
                        <p className="mt-1 text-xs text-stone-500">{formatDateTime(order.createdAt)}</p>
                      </td>
                      <td className="px-5 py-4">{order.tableNumber ?? "-"}</td>
                      <td className="px-5 py-4">
                        <CashierPill
                          label={getPaymentMeta(order).label}
                          className={getPaymentMeta(order).className}
                        />
                      </td>
                      <td className="px-5 py-4 text-right font-black">{formatCurrency(order.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard className="p-5">
          <p className="text-xl font-black">Payment mix</p>
          <div className="mt-5 space-y-4">
            <MixRow label="Cash" value={cashCount} total={paidCount} className="bg-blue-500" />
            <MixRow label="PayOS" value={payOsCount} total={paidCount} className="bg-orange-500" />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function MixRow({
  label,
  value,
  total,
  className,
}: {
  label: string;
  value: number;
  total: number;
  className: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-bold">{label}</span>
        <span className="text-stone-500">
          {value} · {percent}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-stone-100">
        <div className={cn("h-full rounded-full", className)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-3 rounded-full", color)} />
      <span className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">{label}</span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-stone-500">{label}</span>
      <span className={cn("font-bold text-stone-900", valueClassName)}>{value}</span>
    </div>
  );
}

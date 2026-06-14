import type { CashierView } from "@/components/cashier/cashier-dashboard.types";
import { formatCurrency } from "@/components/customer/customer-session-utils";
import { formatDateTime } from "@/components/owner/tables/helpers";
import { getQrImageSrc } from "@/components/payment/payos-qr-panel";
import {
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/helpers/presentation";
import type { CashierPaymentResponse } from "@/types/cashier";
import type { MyTableResponse } from "@/types/me";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

const ORDER_STATUS_CLASS_NAMES: Record<string, string> = {
  PendingConfirmation: "bg-amber-100 text-amber-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Preparing: "bg-orange-100 text-orange-700",
  PartiallyReady: "bg-lime-100 text-lime-700",
  ReadyToServe: "bg-emerald-100 text-emerald-700",
  PartiallyServed: "bg-slate-100 text-slate-700",
  Served: "bg-slate-100 text-slate-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-rose-100 text-rose-700",
};

export const getCashierOrderStatusMeta = (status: string) => ({
  label: getOrderStatusLabel(status),
  className: ORDER_STATUS_CLASS_NAMES[status] ?? "bg-slate-100 text-slate-700",
});

export const getCashierPaymentMeta = (order?: OwnerTableOrderHistoryResponse | null) => {
  if (!order?.paymentStatus) {
    return {
      label: "Chưa thanh toán",
      className: "bg-slate-100 text-slate-600",
    };
  }

  if (order.paymentStatus === "SUCCESS") {
    return {
      label: `${getPaymentMethodLabel(order.paymentMethod)} - Thành công`,
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  if (order.paymentStatus === "PENDING") {
    return {
      label: `${getPaymentMethodLabel(order.paymentMethod)} - Đang chờ`,
      className: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: `${getPaymentMethodLabel(order.paymentMethod)} - ${getPaymentStatusLabel(order.paymentStatus)}`,
    className: "bg-rose-100 text-rose-700",
  };
};

export const getCashierPaymentLabel = (order?: OwnerTableOrderHistoryResponse | null) => {
  if (!order?.paymentStatus) {
    return "Chưa thanh toán";
  }

  return order.paymentMethod
    ? `${getPaymentMethodLabel(order.paymentMethod)} - ${getPaymentStatusLabel(order.paymentStatus)}`
    : getPaymentStatusLabel(order.paymentStatus);
};

export const getCashierTableState = (table: MyTableResponse) => {
  if (table.status === "DISABLED") {
    return "disabled";
  }

  return table.currentSession ? "occupied" : "available";
};

export const getCashierOrderCreatedMinutes = (createdAt: string) => {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  return Math.max(Math.floor(diffMs / 60000), 0);
};

export const getCashierBranchName = (
  branchId: string | undefined,
  branches: Array<{ branchId: string; name: string }>
) => branches.find((branch) => branch.branchId === branchId)?.name ?? "-";

export const getCashierViewTitle = (view: CashierView) => {
  const titles: Record<CashierView, string> = {
    orders: "Quản lý đơn hàng",
    tables: "Sơ đồ bàn",
    create: "Tạo đơn mới",
    history: "Lịch sử giao dịch",
    report: "Báo cáo ca",
  };

  return titles[view];
};

export const getCashierListMetrics = (
  visibleOrders: OwnerTableOrderHistoryResponse[],
  activeOrders: OwnerTableOrderHistoryResponse[]
) => ({
  visibleTotal: visibleOrders.reduce((sum, order) => sum + order.totalAmount, 0),
  needPaymentCount: activeOrders.filter(
    (order) => order.paymentStatus !== "SUCCESS"
  ).length,
});

export const getCashierReportMetrics = (
  orders: OwnerTableOrderHistoryResponse[]
) => {
  const paidOrders = orders.filter(
    (order) => order.paymentStatus === "SUCCESS"
  );
  const paidRevenue = paidOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );
  const pendingRevenue = orders
    .filter((order) => order.paymentStatus !== "SUCCESS")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  return {
    paidCount: paidOrders.length,
    paidRevenue,
    pendingRevenue,
    averageTicket: paidOrders.length > 0 ? paidRevenue / paidOrders.length : 0,
  };
};

export const printCashierReceipt = (
  order: OwnerTableOrderHistoryResponse,
  payOsPayment?: CashierPaymentResponse | null
) => {
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
      `
    )
    .join("");
  const qrImageSrc =
    payOsPayment?.paymentMethod === "PAYOS"
      ? getQrImageSrc(payOsPayment.qrCode, payOsPayment.checkoutUrl)
      : null;

  receipt.document.write(`
    <html lang="vi">
      <head>
        <title>Hóa đơn ${order.orderNumber}</title>
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
        <h1>Hóa đơn ScanNow</h1>
        <p>Mã đơn: ${order.orderNumber}</p>
        <p>Bàn: ${order.tableNumber ?? "-"}</p>
        <p>Phiên: ${order.sessionCode ?? "-"}</p>
        <p>Thời gian: ${formatDateTime(order.createdAt)}</p>
        <table>${rows}</table>
        <p>Tạm tính: ${formatCurrency(order.subTotal)}</p>
        <p>VAT: ${formatCurrency(order.vatAmount)}</p>
        <p>Phí phục vụ: ${formatCurrency(order.serviceChargeAmount)}</p>
        ${order.discountAmount > 0 ? `<p>Giảm giá: -${formatCurrency(order.discountAmount)}</p>` : ""}
        <div class="total"><span>Tổng cộng</span><span>${formatCurrency(order.totalAmount)}</span></div>
        <p>Thanh toán: ${getCashierPaymentLabel(order)}</p>
        ${
          order.paymentMethod === "CASH" && order.paymentStatus === "SUCCESS"
            ? `<p>Tiền khách đưa: ${formatCurrency(order.amountReceived ?? order.totalAmount)}</p><p>Tiền thừa: ${formatCurrency(order.changeAmount ?? 0)}</p>`
            : ""
        }
        ${
          qrImageSrc
            ? `<div style="margin-top:16px;text-align:center"><p style="font-weight:700">QR PayOS</p><img src="${qrImageSrc}" alt="Mã QR PayOS" style="width:220px;height:220px;padding:8px;background:white" /><p>${payOsPayment?.description ?? ""}</p></div>`
            : ""
        }
      </body>
    </html>
  `);
  receipt.document.close();
  receipt.focus();
  receipt.print();
};

import { PlusCircle, Table2 } from "lucide-react";

import { getCashierOrderStatusMeta } from "@/components/cashier/cashier-dashboard.helpers";
import { CashierEmptyState } from "@/components/cashier/cashier-empty-state";
import { CashierPill } from "@/components/cashier/cashier-pill";
import { CashierSectionCard } from "@/components/cashier/cashier-section-card";
import { CashierSummaryRow } from "@/components/cashier/cashier-summary-row";
import { formatCurrency } from "@/components/customer/customer-session-utils";
import { formatDateTime } from "@/components/owner/tables/helpers";
import { Button } from "@/components/ui/button";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

export function CashierOrderDetailPanel({
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
      <CashierSectionCard>
        <CashierEmptyState
          title="Chưa chọn đơn"
          detail="Chọn một đơn ở cột bên trái để xem chi tiết."
        />
      </CashierSectionCard>
    );
  }

  const statusMeta = getCashierOrderStatusMeta(order.status);

  return (
    <CashierSectionCard className="flex min-h-[520px] flex-col overflow-hidden">
      <div className="border-b border-[#e8e4dc] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight">
                {order.tableNumber ?? "Mang đi"}
              </h2>
              <CashierPill label={statusMeta.label} className={statusMeta.className} />
            </div>
            <p className="mt-1 text-sm text-stone-500">
              {order.orderNumber} · Phiên {order.sessionCode ?? "-"} ·{" "}
              {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="flex gap-2">
            {order.tableId ? (
              <Button type="button" variant="outline" className="rounded-xl" onClick={onAddItems}>
                <PlusCircle className="size-4" />
                Thêm món
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={onOpenTableOrder}
            >
              <Table2 className="size-4" />
              Sơ đồ bàn
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-stone-50/50 p-4">
        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.orderItemId}
              className="rounded-2xl border border-[#ebe7df] bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{item.menuItemName}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Số lượng {item.quantity} · {formatCurrency(item.unitPrice)}
                  </p>
                  {item.note ? (
                    <p className="mt-2 text-xs text-orange-600 italic">{item.note}</p>
                  ) : null}
                </div>
                <p className="text-sm font-black">{formatCurrency(item.subTotal)}</p>
              </div>
            </div>
          ))}
        </div>

        {order.customerName || order.customerNote ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {order.customerName ? (
              <p className="font-bold">Khách hàng: {order.customerName}</p>
            ) : null}
            {order.customerNote ? <p className="mt-1">{order.customerNote}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#e8e4dc] bg-white px-5 py-4">
        <div className="space-y-2 text-sm">
          <CashierSummaryRow label="Tạm tính" value={formatCurrency(order.subTotal)} />
          <CashierSummaryRow label="VAT" value={formatCurrency(order.vatAmount)} />
          <CashierSummaryRow
            label="Phí phục vụ"
            value={formatCurrency(order.serviceChargeAmount)}
          />
          {order.discountAmount > 0 ? (
            <CashierSummaryRow
              label="Giảm giá"
              value={`-${formatCurrency(order.discountAmount)}`}
              valueClassName="text-emerald-700"
            />
          ) : null}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-dashed border-[#e8e4dc] pt-3">
          <span className="text-sm font-bold tracking-[0.18em] text-stone-500 uppercase">
            Tổng cộng
          </span>
          <span className="text-2xl font-black text-blue-600">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>
      </div>
    </CashierSectionCard>
  );
}

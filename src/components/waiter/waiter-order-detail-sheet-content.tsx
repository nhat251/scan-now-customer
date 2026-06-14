import { CheckCheck, ChefHat, Clock3, Loader2 } from "lucide-react";

import { formatCurrency } from "@/components/customer/customer-session-utils";
import { formatDateTime } from "@/components/owner/tables/helpers";
import { getWaiterOrderStatusMeta } from "@/components/waiter/waiter-dashboard.helpers";
import { WaiterEmptyState } from "@/components/waiter/waiter-empty-state";
import { WaiterPill } from "@/components/waiter/waiter-pill";
import { getOrderItemStatusLabel } from "@/helpers/presentation";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

export function WaiterOrderDetailSheetContent({
  order,
  onConfirm,
  confirmPending,
  onMarkServed,
  markServedPending,
  onAddItems,
}: {
  order: OwnerTableOrderHistoryResponse | null;
  onConfirm: (orderId: string) => Promise<void> | void;
  confirmPending: boolean;
  onMarkServed: () => Promise<void> | void;
  markServedPending: boolean;
  onAddItems: () => void;
}) {
  if (!order) {
    return (
      <WaiterEmptyState
        title="Chọn một đơn hàng"
        detail="Chọn đơn trong danh sách để xem chi tiết."
      />
    );
  }

  const statusMeta = getWaiterOrderStatusMeta(order.status);
  const readyItems = order.items.filter((item) => item.status === "Ready");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-[#e8e4dc] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black">Bàn {order.tableNumber ?? "-"}</h2>
              <WaiterPill label={statusMeta.label} className={statusMeta.className} />
            </div>
            <p className="mt-1 text-sm text-stone-500">
              {order.orderNumber} · {formatDateTime(order.createdAt)}
            </p>
          </div>
          {order.tableId ? (
            <button
              type="button"
              onClick={onAddItems}
              className="border-primary-container/20 bg-primary-container/10 text-primary-container rounded-xl border px-3 py-2 text-xs font-bold"
            >
              Thêm món
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-stone-50/60 p-4">
        {order.items.map((item) => (
          <div key={item.orderItemId} className="rounded-2xl border border-[#ebe7df] bg-white p-4">
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
              <div className="text-right">
                <p className="text-sm font-black">{formatCurrency(item.subTotal)}</p>
                <p className="mt-1 text-[11px] font-semibold text-stone-500">
                  {getOrderItemStatusLabel(item.status)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[#e8e4dc] px-5 py-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-bold tracking-[0.18em] text-stone-500 uppercase">
            Tổng cộng
          </span>
          <span className="text-2xl font-black text-orange-600">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>

        {order.status === "PendingConfirmation" ? (
          <button
            type="button"
            onClick={() => onConfirm(order.orderId)}
            disabled={confirmPending}
            className="bg-primary-container flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          >
            {confirmPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCheck className="size-4" />
            )}
            Xác nhận đơn hàng
          </button>
        ) : readyItems.length > 0 ? (
          <button
            type="button"
            onClick={() => onMarkServed()}
            disabled={markServedPending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white disabled:opacity-50"
          >
            {markServedPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ChefHat className="size-4" />
            )}
            Đánh dấu đã phục vụ {readyItems.length} món
          </button>
        ) : (
          <div className="flex h-12 items-center justify-center gap-2 rounded-xl bg-stone-100 text-sm font-bold text-stone-600">
            <Clock3 className="size-4" />
            Theo dõi bếp và bàn
          </div>
        )}
      </div>
    </div>
  );
}

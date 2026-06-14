import {
  getCashierOrderCreatedMinutes,
  getCashierOrderStatusMeta,
  getCashierPaymentMeta,
} from "@/components/cashier/cashier-dashboard.helpers";
import { CashierEmptyState } from "@/components/cashier/cashier-empty-state";
import { CashierPill } from "@/components/cashier/cashier-pill";
import { CashierSectionCard } from "@/components/cashier/cashier-section-card";
import { formatCurrency } from "@/components/customer/customer-session-utils";
import { formatDateTime, getOwnerTableErrorMessage } from "@/components/owner/tables/helpers";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

export function CashierOrdersListPanel({
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
    <CashierSectionCard className="flex min-h-[520px] flex-col overflow-hidden">
      <div className="border-b border-[#e8e4dc] bg-stone-50/70 px-4 py-4">
        <p className="text-sm font-black">Danh sách đơn</p>
        <p className="mt-1 text-xs text-stone-500">Chọn đơn để xem chi tiết và thanh toán.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center gap-3 px-3 py-5 text-sm">
            <Spinner className="size-5 text-blue-600" />
            <span>Đang tải đơn thu ngân...</span>
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {getOwnerTableErrorMessage(error, "Không thể tải đơn thu ngân.")}
          </div>
        ) : null}

        {!isLoading && !isError && orders.length === 0 ? (
          <CashierEmptyState title="Không có đơn phù hợp" detail="Thử đổi bộ lọc hoặc chi nhánh." />
        ) : null}

        <div className="space-y-2">
          {orders.map((order) => {
            const statusMeta = getCashierOrderStatusMeta(order.status);
            const paymentMeta = getCashierPaymentMeta(order);
            const active = selectedOrderId === order.orderId;
            const minutes = getCashierOrderCreatedMinutes(order.createdAt);

            return (
              <button
                key={order.orderId}
                type="button"
                onClick={() => onSelectOrder(order.orderId)}
                className={cn(
                  "w-full rounded-2xl border bg-white p-4 text-left transition-all",
                  active
                    ? "border-blue-200 bg-blue-50/70 shadow-sm"
                    : "border-[#e8e4dc] hover:border-blue-200 hover:bg-stone-50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black tracking-tight text-stone-900">
                        {order.tableNumber ?? "Mang về"}
                      </span>
                      <span className="text-xs font-semibold text-stone-400">
                        {order.orderNumber}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      {order.sessionCode ?? "Chưa có phiên"} · {minutes} phút
                    </p>
                  </div>
                  <CashierPill label={statusMeta.label} className={statusMeta.className} />
                </div>

                <div className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-600">
                  {order.items
                    .slice(0, 2)
                    .map((item) => `${item.menuItemName} x${item.quantity}`)
                    .join(", ")}
                  {order.items.length > 2 ? "..." : ""}
                </div>

                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="space-y-1">
                    <CashierPill label={paymentMeta.label} className={paymentMeta.className} />
                    <p className="text-xs text-stone-500">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <p className="text-lg font-black text-orange-600">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </CashierSectionCard>
  );
}

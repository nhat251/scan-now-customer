import { Printer } from "lucide-react";

import { getCashierPaymentMeta } from "@/components/cashier/cashier-dashboard.helpers";
import { CashierEmptyState } from "@/components/cashier/cashier-empty-state";
import { CashierOrdersListPanel } from "@/components/cashier/cashier-orders-list-panel";
import { CashierPill } from "@/components/cashier/cashier-pill";
import { CashierSectionCard } from "@/components/cashier/cashier-section-card";
import { formatCurrency } from "@/components/customer/customer-session-utils";
import { formatDateTime } from "@/components/owner/tables/helpers";
import { Button } from "@/components/ui/button";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

export function CashierHistoryPanel({
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
      <CashierOrdersListPanel
        orders={orders}
        isLoading={isLoading}
        isError={isError}
        error={error}
        selectedOrderId={selectedOrderId}
        onSelectOrder={onSelectOrder}
      />

      <CashierSectionCard className="flex min-h-[520px] flex-col overflow-hidden">
        <div className="border-b border-[#e8e4dc] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xl font-black">Lịch sử hóa đơn</p>
              <p className="mt-1 text-sm text-stone-500">Chi tiết giao dịch đã thu tiền.</p>
            </div>
            {selectedOrder ? (
              <Button type="button" variant="soft" className="rounded-xl" onClick={onPrint}>
                <Printer className="size-4" />
                In lại
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
                    Bàn {selectedOrder.tableNumber ?? "-"} ·{" "}
                    {formatDateTime(selectedOrder.paidAt ?? selectedOrder.createdAt)}
                  </p>
                </div>
                <CashierPill
                  label={getCashierPaymentMeta(selectedOrder).label}
                  className={getCashierPaymentMeta(selectedOrder).className}
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {selectedOrder.items.map((item) => (
                <div
                  key={item.orderItemId}
                  className="flex items-start justify-between rounded-2xl border border-[#ebe7df] bg-white p-4"
                >
                  <div>
                    <p className="text-sm font-bold">{item.menuItemName}</p>
                    <p className="mt-1 text-xs text-stone-500">Số lượng {item.quantity}</p>
                  </div>
                  <p className="text-sm font-black">{formatCurrency(item.subTotal)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <CashierEmptyState
            title="Chưa chọn giao dịch"
            detail="Chọn giao dịch đã thanh toán ở danh sách bên trái."
          />
        )}
      </CashierSectionCard>
    </section>
  );
}

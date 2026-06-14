"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { formatCurrency } from "@/components/customer/customer-session-utils";
import { formatDateTime } from "@/components/owner/tables/helpers";
import { getWaiterOrderStatusMeta } from "@/components/waiter/waiter-dashboard.helpers";
import type { OrderFilter } from "@/components/waiter/waiter-dashboard.types";
import { WaiterEmptyState } from "@/components/waiter/waiter-empty-state";
import { WaiterOrderDetailSheetContent } from "@/components/waiter/waiter-order-detail-sheet-content";
import { WaiterPill } from "@/components/waiter/waiter-pill";
import { cn } from "@/lib/utils";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

export function WaiterOrdersView({
  orders,
  isLoading,
  orderFilter,
  onFilterChange,
  searchInput,
  onSearchChange,
  selectedOrder,
  selectedOrderId,
  onSelectOrder,
  onConfirm,
  confirmPending,
  onMarkServed,
  markServedPending,
  onAddItems,
}: {
  orders: OwnerTableOrderHistoryResponse[];
  isLoading: boolean;
  orderFilter: OrderFilter;
  onFilterChange: (filter: OrderFilter) => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  selectedOrder: OwnerTableOrderHistoryResponse | null;
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  onConfirm: (orderId: string) => void;
  confirmPending: boolean;
  onMarkServed: () => void;
  markServedPending: boolean;
  onAddItems: () => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (selectedOrder) {
      setSheetOpen(true);
    }
  }, [selectedOrderId, selectedOrder]);

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="border-b border-[#e8e4dc] bg-white px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: "all" as OrderFilter, label: "Tất cả" },
              { key: "pending" as OrderFilter, label: "Chờ xác nhận" },
              { key: "preparing" as OrderFilter, label: "Đang chế biến" },
              { key: "ready" as OrderFilter, label: "Sẵn sàng" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onFilterChange(item.key)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-xs font-bold",
                  orderFilter === item.key
                    ? "bg-primary-container text-white"
                    : "bg-stone-100 text-stone-600"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="relative mt-3 block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
            <input
              value={searchInput}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm bàn hoặc đơn hàng..."
              className="h-10 w-full rounded-xl border border-[#e8e4dc] bg-[#f8f7f4] pr-3 pl-10 text-sm outline-none"
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto pt-3 pb-28">
          <div className="space-y-[10px] px-4">
            {isLoading ? (
              <div className="flex items-center gap-3 text-sm">
                <Loader2 className="text-primary-container size-4 animate-spin" />
                <span>Đang tải đơn hàng...</span>
              </div>
            ) : null}

            {!isLoading && orders.length === 0 ? (
              <WaiterEmptyState
                title="Chưa có đơn hàng phù hợp"
                detail="Thử đổi bộ lọc hoặc chi nhánh."
              />
            ) : null}

            {orders.map((order) => {
              const statusMeta = getWaiterOrderStatusMeta(order.status);
              const active = selectedOrderId === order.orderId;
              const readyCount = order.items.filter((item) => item.status === "Ready").length;

              return (
                <button
                  key={order.orderId}
                  type="button"
                  onClick={() => onSelectOrder(order.orderId)}
                  className={cn(
                    "w-full rounded-[22px] border bg-white p-4 text-left shadow-sm transition-all active:scale-[0.99]",
                    active
                      ? "border-primary-container/20 bg-primary-container/10/70"
                      : "border-[#e8e4dc]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-container/10 text-primary-container flex size-11 items-center justify-center rounded-[14px] text-lg font-black">
                        {order.tableNumber ?? "Mang về"}
                      </div>
                      <div>
                        <p className="text-sm font-black">Bàn {order.tableNumber ?? "Mang về"}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          {order.orderNumber} · {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <WaiterPill label={statusMeta.label} className={statusMeta.className} />
                  </div>

                  <div className="mt-3 rounded-2xl bg-stone-50 px-3 py-2 text-xs text-stone-600">
                    {order.items
                      .slice(0, 2)
                      .map((item) => `${item.menuItemName} x${item.quantity}`)
                      .join(", ")}
                    {order.items.length > 2 ? "..." : ""}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-black text-orange-600">
                      {formatCurrency(order.totalAmount)}
                    </span>
                    {readyCount > 0 ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                        {readyCount} món sẵn sàng
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {sheetOpen && selectedOrder ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="fixed bottom-0 left-1/2 z-50 flex h-[88%] w-full max-w-[500px] -translate-x-1/2 flex-col rounded-t-[24px] bg-white shadow-2xl">
            <div className="flex justify-center py-3">
              <div className="h-1.5 w-10 rounded-full bg-stone-200" />
            </div>
            <WaiterOrderDetailSheetContent
              order={selectedOrder}
              onConfirm={async (orderId) => {
                await onConfirm(orderId);
                setSheetOpen(false);
              }}
              confirmPending={confirmPending}
              onMarkServed={async () => {
                await onMarkServed();
                setSheetOpen(false);
              }}
              markServedPending={markServedPending}
              onAddItems={() => {
                onAddItems();
                setSheetOpen(false);
              }}
            />
          </div>
        </>
      ) : null}
    </>
  );
}

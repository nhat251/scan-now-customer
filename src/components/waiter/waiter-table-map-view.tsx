import { Loader2, PlusCircle, Table2, XCircle } from "lucide-react";

import { formatCurrency } from "@/components/customer/customer-session-utils";
import { getWaiterTableState } from "@/components/waiter/waiter-dashboard.helpers";
import { WaiterLegendDot } from "@/components/waiter/waiter-legend-dot";
import { cn } from "@/lib/utils";
import type { MyTableResponse } from "@/types/me";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

export function WaiterTableMapView({
  tables,
  activeOrders,
  readyGroups,
  isLoading,
  selectedTable,
  onSelectTable,
  onOpenTable,
  onCloseTable,
  onCreateOrder,
  onViewOrders,
  openPending,
  closePending,
}: {
  tables: MyTableResponse[];
  activeOrders: OwnerTableOrderHistoryResponse[];
  readyGroups: Array<{ tableId: string | null; tableNumber: string | null; orders: unknown[] }>;
  isLoading: boolean;
  selectedTable: MyTableResponse | null;
  onSelectTable: (table: MyTableResponse | null) => void;
  onOpenTable: (table: MyTableResponse) => Promise<void> | void;
  onCloseTable: (table: MyTableResponse) => Promise<void> | void;
  onCreateOrder: (tableId: string | null) => void;
  onViewOrders: (orderId: string) => void;
  openPending: boolean;
  closePending: boolean;
}) {
  const tableOrder = selectedTable
    ? (activeOrders.find((order) => order.tableId === selectedTable.tableId) ?? null)
    : null;

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="border-b border-[#e8e4dc] bg-white px-4 py-3">
          <div className="flex flex-wrap gap-4 text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
            <WaiterLegendDot color="bg-emerald-500" label="Còn trống" />
            <WaiterLegendDot color="bg-orange-500" label="Có khách" />
            <WaiterLegendDot color="bg-slate-400" label="Ngừng sử dụng" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center gap-3 text-sm">
              <Loader2 className="text-primary-container size-4 animate-spin" />
              <span>Đang tải bàn...</span>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-4 pb-28">
            {tables.map((table) => {
              const state = getWaiterTableState(table);
              const order = activeOrders.find((item) => item.tableId === table.tableId) ?? null;
              const hasReady = readyGroups.some((group) => group.tableId === table.tableId);
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
                  onClick={() => onSelectTable(table)}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-3xl border-2 px-3 py-4 transition-all",
                    className
                  )}
                >
                  {hasReady ? (
                    <span className="absolute top-2 right-2 size-3 rounded-full bg-emerald-300" />
                  ) : null}
                  <span className="text-2xl font-black">{table.tableNumber}</span>
                  {order ? (
                    <span className="mt-2 rounded-full bg-black/10 px-2 py-1 text-[10px] font-bold">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  ) : (
                    <span className="mt-2 text-[10px] font-bold tracking-[0.18em] uppercase opacity-70">
                      {state === "available" ? `${table.capacity} chỗ` : "Ngừng sử dụng"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedTable ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => onSelectTable(null)} />
          <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[500px] -translate-x-1/2 rounded-t-[28px] bg-white px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl">
            <div className="mb-3 flex justify-center">
              <div className="h-1.5 w-10 rounded-full bg-stone-200" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black">Bàn {selectedTable.tableNumber}</h3>
                <p className="mt-1 text-sm text-stone-500">{selectedTable.capacity} chỗ</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-[#e8e4dc] p-2 text-stone-500"
                onClick={() => onSelectTable(null)}
              >
                <XCircle className="size-4" />
              </button>
            </div>

            {tableOrder ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
                  <p className="text-xs font-bold tracking-[0.2em] text-orange-700 uppercase">
                    Đang phục vụ
                  </p>
                  <p className="mt-2 text-lg font-black text-orange-700">
                    {tableOrder.orderNumber}
                  </p>
                  <p className="mt-1 text-sm text-orange-700">
                    {formatCurrency(tableOrder.totalAmount)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onCreateOrder(selectedTable.tableId);
                      onSelectTable(null);
                    }}
                    className="bg-primary-container flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white"
                  >
                    <PlusCircle className="size-4" />
                    Thêm món
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onViewOrders(tableOrder.orderId);
                      onSelectTable(null);
                    }}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#e8e4dc] bg-white text-sm font-bold text-stone-700"
                  >
                    <Table2 className="size-4" />
                    Xem đơn
                  </button>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await onCloseTable(selectedTable);
                    onSelectTable(null);
                  }}
                  disabled={closePending}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-100 text-sm font-bold text-stone-700 disabled:opacity-50"
                >
                  {closePending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Table2 className="size-4" />
                  )}
                  Đóng bàn
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    onCreateOrder(selectedTable.tableId);
                    onSelectTable(null);
                  }}
                  className="bg-primary-container flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white"
                >
                  <PlusCircle className="size-4" />
                  Mở bàn / Tạo đơn
                </button>
                {!selectedTable.currentSession ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await onOpenTable(selectedTable);
                      onSelectTable(null);
                    }}
                    disabled={openPending}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#e8e4dc] bg-white text-sm font-bold text-stone-700 disabled:opacity-50"
                  >
                    {openPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Table2 className="size-4" />
                    )}
                    Mở phiên bàn
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

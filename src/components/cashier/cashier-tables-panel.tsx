"use client";

import { useState } from "react";
import { Banknote, Loader2, PlusCircle, Table2, XCircle } from "lucide-react";

import { getCashierTableState } from "@/components/cashier/cashier-dashboard.helpers";
import { CashierLegendDot } from "@/components/cashier/cashier-legend-dot";
import { CashierSectionCard } from "@/components/cashier/cashier-section-card";
import { formatCurrency } from "@/components/customer/customer-session-utils";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { MyTableResponse } from "@/types/me";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

export function CashierTablesPanel({
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
    ? (activeOrders.find((order) => order.tableId === selectedTable.tableId) ?? null)
    : null;

  return (
    <>
      <CashierSectionCard className="overflow-hidden">
        <div className="border-b border-[#e8e4dc] px-5 py-4">
          <p className="text-xl font-black">Sơ đồ bàn</p>
          <p className="mt-1 text-sm text-stone-500">
            Theo dõi bàn trống, bàn có khách và luồng thanh toán ngay trên sơ đồ.
          </p>
        </div>

        <div className="p-5">
          <div className="mb-5 flex flex-wrap gap-4 text-sm">
            <CashierLegendDot color="bg-emerald-500" label="Còn trống" />
            <CashierLegendDot color="bg-orange-500" label="Có khách" />
            <CashierLegendDot color="bg-slate-400" label="Ngừng sử dụng" />
          </div>

          {isLoading ? (
            <div className="flex items-center gap-3 text-sm">
              <Spinner className="size-5 text-blue-600" />
              <span>Đang tải bàn...</span>
            </div>
          ) : null}

          {!isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {tables.map((table) => {
                const state = getCashierTableState(table);
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
                      className
                    )}
                  >
                    {order ? (
                      <span className="absolute top-2 right-2 rounded-full bg-black/10 px-2 py-1 text-[10px] font-bold">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    ) : null}
                    <span className="text-3xl font-black tracking-tight">{table.tableNumber}</span>
                    <span className="mt-2 text-xs font-semibold tracking-[0.18em] uppercase opacity-75">
                      {state === "occupied"
                        ? "Đang phục vụ"
                        : state === "available"
                          ? `${table.capacity} chỗ`
                          : "Ngừng sử dụng"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </CashierSectionCard>

      {selectedTable ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelectedTable(null)} />
          <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-[420px] rounded-[28px] border border-[#e8e4dc] bg-white p-5 shadow-2xl md:bottom-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black">Bàn {selectedTable.tableNumber}</h3>
                <p className="mt-1 text-sm text-stone-500">{selectedTable.capacity} chỗ</p>
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
                  <p className="text-xs font-bold tracking-[0.2em] text-orange-700 uppercase">
                    Đơn đang hoạt động
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
                      onCollect(tableOrder.orderId);
                      setSelectedTable(null);
                    }}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-bold text-blue-700"
                  >
                    <Banknote className="size-4" />
                    Thanh toán
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
                    Thêm món
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
                  {closeTablePending ? (
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
                    onCreate(selectedTable.tableId);
                    setSelectedTable(null);
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white"
                >
                  <PlusCircle className="size-4" />
                  Tạo đơn mới
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
                    {openTablePending ? (
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

/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { ArrowRight, ChefHat, Loader2, PlusCircle, Search, Table2, XCircle } from "lucide-react";

import { formatCurrency } from "@/components/customer/customer-session-utils";
import { Label } from "@/components/ui/label";
import type { WaiterCartItem } from "@/components/waiter/waiter-dashboard.types";
import { WaiterEmptyState } from "@/components/waiter/waiter-empty-state";
import { cn } from "@/lib/utils";
import type { MyMenuItemResponse, MyTableResponse } from "@/types/me";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

export function WaiterCreateOrderView({
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
  cartItems: WaiterCartItem[];
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
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [tableSheetOpen, setTableSheetOpen] = useState(false);
  const selectedTableLabel = selectedTable
    ? `Bàn ${selectedTable.tableNumber}`
    : "Chọn bàn phục vụ";

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto pb-32">
          <div className="mx-4 mt-4 space-y-2">
            <Label required className="text-xs font-bold text-stone-600">
              Chọn bàn phục vụ
            </Label>
            <button
              type="button"
              onClick={() => setTableSheetOpen(true)}
              className="flex w-full items-center justify-between rounded-[22px] border border-[#e8e4dc] bg-white px-4 py-4 text-left shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary-container/10 text-primary-container flex size-10 items-center justify-center rounded-2xl">
                  <Table2 className="size-5" />
                </div>
                <div>
                  <p className="flex items-center gap-1 text-sm font-black">{selectedTableLabel}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {selectedTableOrders.length > 0
                      ? "Bàn đang có đơn, có thể gọi thêm món"
                      : "Nhấn để chọn bàn phục vụ"}
                  </p>
                </div>
              </div>
              <ArrowRight className="size-4 text-stone-400" />
            </button>
          </div>

          <div className="px-4 pt-4">
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Tìm món ăn..."
                className="h-11 w-full rounded-2xl border border-[#e8e4dc] bg-white pr-3 pl-10 text-sm outline-none"
              />
            </label>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
            <button
              type="button"
              onClick={() => onCategoryChange("all")}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-bold",
                activeCategory === "all"
                  ? "bg-primary-container text-white"
                  : "bg-white text-stone-600"
              )}
            >
              Tất cả
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-xs font-bold",
                  activeCategory === category.id
                    ? "bg-primary-container text-white"
                    : "bg-white text-stone-600"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="space-y-3 px-4 pt-4">
            {selectedTable ? (
              <div className="border-primary-container/15 bg-primary-container/10 rounded-[22px] border px-4 py-3">
                <p className="text-primary-container text-[11px] font-bold tracking-[0.18em] uppercase">
                  Bàn đang chọn
                </p>
                <p className="text-primary-container mt-1 text-sm font-bold">
                  {selectedTableLabel}
                  {selectedTableOrders.length > 0 ? " · Đang phục vụ" : " · Sẵn sàng tạo đơn"}
                </p>
              </div>
            ) : null}

            {menuItems.map((item) => {
              const cartItem = cartItems.find(
                (cart) => cart.menuItem.menuItemId === item.menuItemId
              );

              return (
                <article
                  key={item.menuItemId}
                  className="rounded-[24px] border border-[#ebe7df] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-[84px] shrink-0 overflow-hidden rounded-[18px] bg-stone-100">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-stone-200">
                          <ChefHat className="size-7 text-stone-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-black">{item.name}</p>
                          <p className="mt-1 text-[11px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
                            {item.categoryName ?? "Thực đơn"}
                          </p>
                        </div>
                        <p className="shrink-0 text-base font-black text-orange-600">
                          {formatCurrency(item.price)}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span
                          className={cn(
                            "text-[12px] font-bold",
                            item.isAvailable ? "text-emerald-600" : "text-rose-600"
                          )}
                        >
                          {item.isAvailable ? "Còn món" : "Hết món"}
                        </span>

                        {cartItem ? (
                          <div className="bg-primary-container/10 flex items-center rounded-2xl px-2 py-2">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.menuItemId, -1)}
                              className="text-primary-container flex size-9 items-center justify-center rounded-xl bg-white"
                            >
                              -
                            </button>
                            <span className="text-primary-container w-10 text-center text-sm font-black">
                              {cartItem.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.menuItemId, 1)}
                              className="bg-primary-container flex size-9 items-center justify-center rounded-xl text-white"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAddToCart(item)}
                            disabled={!item.isAvailable}
                            className="border-primary-container/20 bg-primary-container/10 text-primary-container flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-bold disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
                          >
                            <PlusCircle className="size-4" />
                            Thêm
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {cartItems.length > 0 ? (
        <button
          type="button"
          onClick={() => setCartSheetOpen(true)}
          className="bg-primary-container shadow-primary-container/25 fixed bottom-[88px] left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-[468px] -translate-x-1/2 items-center justify-between rounded-[22px] px-5 py-4 text-white shadow-2xl active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xl bg-white/20 text-sm font-black">
              {cartItems.reduce((sum, item) => sum + item.qty, 0)}
            </div>
            <div className="text-left">
              <p className="text-sm font-black">Xem giỏ hàng</p>
              <p className="text-xs text-white/75">
                {selectedTableOrders.length > 0
                  ? "Thêm món vào đơn đang phục vụ"
                  : "Tạo đơn mới cho bàn"}
              </p>
            </div>
          </div>
          <p className="text-lg font-black">{formatCurrency(cartTotal)}</p>
        </button>
      ) : null}

      {tableSheetOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setTableSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[500px] -translate-x-1/2 rounded-t-[28px] bg-white px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl">
            <div className="mb-3 flex justify-center">
              <div className="h-1.5 w-10 rounded-full bg-stone-200" />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-lg font-black">Chọn bàn phục vụ</p>
              <button
                type="button"
                onClick={() => setTableSheetOpen(false)}
                className="rounded-full p-1 text-stone-500"
              >
                <XCircle className="size-5" />
              </button>
            </div>
            <div className="mt-4 grid max-h-[52vh] grid-cols-4 gap-3 overflow-y-auto">
              {tables
                .filter((table) => table.status !== "DISABLED")
                .map((table) => {
                  const selectable =
                    !table.currentSession || table.tableId === selectedTable?.tableId;

                  return (
                    <button
                      key={table.tableId}
                      type="button"
                      disabled={!selectable}
                      onClick={() => {
                        onSelectTable(table.tableId);
                        setTableSheetOpen(false);
                      }}
                      className={cn(
                        "flex h-14 flex-col items-center justify-center rounded-2xl border-2 text-center transition-all",
                        table.tableId === selectedTable?.tableId
                          ? "border-primary-container bg-primary-container text-white"
                          : selectable
                            ? "border-[#e8e4dc] bg-white text-stone-900"
                            : "border-stone-100 bg-stone-50 text-stone-300"
                      )}
                    >
                      <span className="text-sm font-black">{table.tableNumber}</span>
                      <span className="text-[9px] font-bold uppercase">
                        {table.currentSession ? "Đang dùng" : "Còn trống"}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </>
      ) : null}

      {cartSheetOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setCartSheetOpen(false)} />
          <div className="fixed bottom-0 left-1/2 z-50 flex h-[84%] w-full max-w-[500px] -translate-x-1/2 flex-col rounded-t-[28px] bg-white shadow-2xl">
            <div className="flex justify-center py-3">
              <div className="h-1.5 w-10 rounded-full bg-stone-200" />
            </div>
            <div className="border-b border-[#e8e4dc] px-5 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-black">Giỏ hàng</p>
                  <p className="mt-1 text-sm text-stone-500">{selectedTableLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCartSheetOpen(false)}
                  className="rounded-full p-1 text-stone-500"
                >
                  <XCircle className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {cartItems.length === 0 ? (
                <WaiterEmptyState
                  title="Giỏ hàng đang trống"
                  detail="Thêm món từ danh sách bên trên."
                />
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.menuItem.menuItemId}
                    className="rounded-[22px] border border-[#ebe7df] bg-stone-50 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{item.menuItem.name}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          {formatCurrency(item.menuItem.price)}
                        </p>
                      </div>
                      <p className="text-sm font-black">
                        {formatCurrency(item.menuItem.price * item.qty)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.menuItem.menuItemId, -1)}
                        className="text-primary-container flex size-8 items-center justify-center rounded-xl bg-white"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-black">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.menuItem.menuItemId, 1)}
                        className="bg-primary-container flex size-8 items-center justify-center rounded-xl text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[#e8e4dc] px-5 py-4">
              <div className="space-y-3">
                <input
                  value={customerName}
                  onChange={(event) => onCustomerNameChange(event.target.value)}
                  placeholder="Tên khách (không bắt buộc)"
                  className="h-11 w-full rounded-2xl border border-[#e8e4dc] bg-white px-3 text-sm outline-none"
                />
                <input
                  value={customerNote}
                  onChange={(event) => onCustomerNoteChange(event.target.value)}
                  placeholder="Ghi chú (không bắt buộc)"
                  className="h-11 w-full rounded-2xl border border-[#e8e4dc] bg-white px-3 text-sm outline-none"
                />
                <div className="flex items-center justify-between border-t border-dashed border-[#e8e4dc] pt-3">
                  <span className="text-sm font-bold tracking-[0.18em] text-stone-500 uppercase">
                    Tổng cộng
                  </span>
                  <span className="text-2xl font-black text-orange-600">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await onSubmit();
                    setCartSheetOpen(false);
                  }}
                  disabled={!selectedTable || cartItems.length === 0 || isSubmitting}
                  className="bg-primary-container flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                  {selectedTableOrders.length > 0 ? "Thêm món vào bàn" : "Gửi đơn hàng"}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

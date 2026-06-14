import { ArrowRight, Loader2, PlusCircle, Search } from "lucide-react";

import type { CashierCartItem } from "@/components/cashier/cashier-dashboard.types";
import { CashierEmptyState } from "@/components/cashier/cashier-empty-state";
import { CashierSectionCard } from "@/components/cashier/cashier-section-card";
import { formatCurrency } from "@/components/customer/customer-session-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { MyMenuItemResponse, MyTableResponse } from "@/types/me";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

export function CashierCreateOrderPanel({
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
      <CashierSectionCard className="overflow-hidden">
        <div className="border-b border-[#e8e4dc] px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xl font-black">Tạo đơn thủ công</p>
              <p className="mt-1 text-sm text-stone-500">
                Thu ngân có thể tạo đơn hoặc thêm món cho bàn đang phục vụ.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="cashier-table-select"
                required
                className="text-xs font-bold text-stone-600"
              >
                Chọn bàn phục vụ
              </Label>
              <select
                id="cashier-table-select"
                value={selectedTable?.tableId ?? ""}
                onChange={(event) => onSelectTable(event.target.value || null)}
                className="h-11 rounded-xl border border-[#e8e4dc] bg-white px-3 text-sm font-semibold outline-none"
              >
                <option value="">Chọn bàn</option>
                {tables
                  .filter((table) => table.status !== "DISABLED")
                  .map((table) => (
                    <option key={table.tableId} value={table.tableId}>
                      Bàn {table.tableNumber} · {table.currentSession ? "Đang phục vụ" : "Trống"}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        <div className="border-b border-[#e8e4dc] bg-stone-50/70 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCategoryChange("all")}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold",
                activeCategory === "all" ? "bg-blue-600 text-white" : "bg-white text-stone-600"
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
                  "rounded-full px-4 py-2 text-xs font-bold",
                  activeCategory === category.id
                    ? "bg-blue-600 text-white"
                    : "bg-white text-stone-600"
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
              placeholder="Tìm món ăn..."
              className="h-11 rounded-xl border-[#e8e4dc] pl-10"
            />
          </label>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {menuItems.map((item) => {
            const cartItem = cartItems.find((cart) => cart.menuItem.menuItemId === item.menuItemId);

            return (
              <div
                key={item.menuItemId}
                className="rounded-3xl border border-[#ebe7df] bg-white p-4 shadow-sm"
              >
                <div className="flex min-h-[80px] flex-col">
                  <p className="text-sm font-black">{item.name}</p>
                  <p className="mt-1 text-xs text-stone-500">{item.categoryName ?? "Món ăn"}</p>
                  <p className="mt-auto pt-4 text-lg font-black text-blue-600">
                    {formatCurrency(item.price)}
                  </p>
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
                      Thêm
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CashierSectionCard>

      <CashierSectionCard className="flex flex-col overflow-hidden">
        <div className="border-b border-[#e8e4dc] px-5 py-4">
          <p className="text-xl font-black">Giỏ hàng</p>
          <p className="mt-1 text-sm text-stone-500">
            {selectedTable ? `Bàn ${selectedTable.tableNumber}` : "Chọn bàn để tạo đơn"}
          </p>
        </div>

        {selectedTableOrders.length > 0 ? (
          <div className="border-b border-[#e8e4dc] bg-stone-50 px-5 py-3 text-sm text-stone-600">
            <p className="font-semibold">
              Bàn này đang có {selectedTableOrders.length} đơn đang mở.
            </p>
            <p className="mt-1 text-xs">Món mới sẽ được thêm vào đơn đang hoạt động của bàn.</p>
          </div>
        ) : null}

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {cartItems.length === 0 ? (
            <CashierEmptyState
              title="Giỏ hàng đang trống"
              detail="Chọn món ở bên trái để thêm vào đơn."
            />
          ) : (
            cartItems.map((item) => (
              <div
                key={item.menuItem.menuItemId}
                className="rounded-2xl border border-[#ebe7df] bg-stone-50 px-4 py-3"
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
              placeholder="Tên khách hàng (không bắt buộc)"
              className="h-11 rounded-xl border-[#e8e4dc]"
            />
            <Input
              value={customerNote}
              onChange={(event) => onCustomerNoteChange(event.target.value)}
              placeholder="Ghi chú khách hàng (không bắt buộc)"
              className="h-11 rounded-xl border-[#e8e4dc]"
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
              onClick={onSubmit}
              disabled={!selectedTable || cartItems.length === 0 || isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              {selectedTableOrders.length > 0 ? "Thêm món vào bàn" : "Tạo đơn mới"}
            </button>
          </div>
        </div>
      </CashierSectionCard>
    </div>
  );
}

/* eslint-disable @next/next/no-img-element */

import { ChefHat, Search } from "lucide-react";

import { formatCurrency } from "@/components/customer/customer-session-utils";
import { cn } from "@/lib/utils";
import type { MyMenuItemResponse } from "@/types/me";

export function WaiterMenuView({
  menuItems,
  categories,
  activeCategory,
  onCategoryChange,
  search,
  onSearchChange,
}: {
  menuItems: Array<MyMenuItemResponse & { categoryName?: string | null }>;
  categories: Array<{ id: string; name: string }>;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mt-3 shrink-0 px-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm món ăn, đồ uống..."
            className="h-10 w-full rounded-[10px] border border-[#e8e4dc] bg-[#f8f7f4] pr-3 pl-10 text-sm outline-none"
          />
        </label>
      </div>

      <div className="my-4 flex shrink-0 gap-2 overflow-x-auto px-4">
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all",
            activeCategory === "all"
              ? "bg-primary-container text-white"
              : "bg-[#f1efe9] text-stone-600"
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
              "shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all",
              activeCategory === category.id
                ? "bg-primary-container text-white"
                : "bg-[#f1efe9] text-stone-600"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-28">
        <div className="space-y-5">
          {menuItems.map((item) => (
            <article
              key={item.menuItemId}
              className="rounded-[28px] border border-[#e8e4dc] bg-white p-5 shadow-[0_2px_14px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-4">
                <div className="size-[100px] shrink-0 overflow-hidden rounded-[18px] bg-stone-100">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-stone-200">
                      <ChefHat className="size-8 text-stone-400" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[18px] font-bold text-stone-900">{item.name}</h3>
                      <p className="mt-2 text-[13px] font-medium tracking-[0.16em] text-stone-400 uppercase">
                        {item.categoryName ?? "Thực đơn"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[18px] font-black text-orange-600">
                        {formatCurrency(item.price)}
                      </p>
                      <p
                        className={cn(
                          "mt-2 text-[13px] font-bold",
                          item.isAvailable ? "text-emerald-600" : "text-rose-600"
                        )}
                      >
                        {item.isAvailable ? "Còn món" : "Hết món"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

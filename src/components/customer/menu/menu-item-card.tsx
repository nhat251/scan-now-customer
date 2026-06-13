"use client";

import Image from "next/image";
import { Minus, Plus, Utensils } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MenuItemResponse } from "@/types/public-ordering";

type MenuItemCardProps = {
  item: MenuItemResponse;
  quantity: number;
  onUpdateQuantity: (item: MenuItemResponse, qty: number) => void;
  formatVND: (amount: number) => string;
};

export const MenuItemCard = ({
  item,
  quantity,
  onUpdateQuantity,
  formatVND,
}: MenuItemCardProps) => {
  return (
    <div className="flex gap-4 rounded-xl border border-slate-900 bg-slate-900/40 p-3 transition hover:border-slate-800">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-cover" />
        ) : (
          <div className="text-slate-650 flex h-full w-full items-center justify-center">
            <Utensils className="h-8 w-8 stroke-1" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold text-white">{item.name}</h3>
          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{item.description}</p>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-bold text-indigo-400">{formatVND(item.price)}</span>

          {quantity > 0 ? (
            <div className="flex items-center space-x-2.5 rounded-lg bg-indigo-500/10 p-1 ring-1 ring-indigo-500/20">
              <button
                onClick={() => onUpdateQuantity(item, quantity - 1)}
                className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/10 text-indigo-400 transition active:scale-95"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-4 text-center text-xs font-bold text-white">{quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item, quantity + 1)}
                className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/10 text-indigo-400 transition active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Button
              onClick={() => onUpdateQuantity(item, 1)}
              disabled={!item.isAvailable}
              className="h-7 rounded-lg bg-indigo-600 px-3 text-xs font-medium text-white hover:bg-indigo-500"
            >
              {item.isAvailable ? "Thêm" : "Hết món"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

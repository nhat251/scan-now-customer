"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PATH } from "@/constants/path";
import type { CartDto, CartItemDto } from "@/types/cart";

import { formatCurrency } from "./customer-session-utils";

type Props = {
  cart: CartDto;
  sessionCode: string;
  open: boolean;
  isUpdating: boolean;
  onOpenChange: (open: boolean) => void;
  onQuantityChange: (item: CartItemDto, delta: number) => Promise<void>;
  onNoteChange: (menuItemId: string, note: string) => Promise<void>;
  onClear: () => Promise<void>;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80";

export const SessionCartSheet = ({
  cart,
  sessionCode,
  open,
  isUpdating,
  onOpenChange,
  onQuantityChange,
  onNoteChange,
  onClear,
}: Props) => {
  const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[80]"
        className="data-[state=open]:slide-in-from-bottom-10 data-[state=closed]:slide-out-to-bottom-10 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 top-auto bottom-0 left-1/2 z-[90] flex h-[68dvh] max-h-[720px] max-w-md translate-y-0 flex-col gap-0 rounded-t-[2rem] rounded-b-none border-x-0 border-b-0 bg-white p-0 shadow-2xl duration-300"
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-gray-200" />
        <DialogHeader className="flex-row items-start justify-between gap-3 px-5 pt-4 pb-3 text-left">
          <div>
            <DialogTitle className="text-xl font-black">Giỏ hàng của bạn</DialogTitle>
            <DialogDescription className="mt-1">
              {totalItems} món - thêm ghi chú riêng trước khi gửi đơn
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label="Đóng giỏ hàng">
              <X className="size-5" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-gray-100 px-4 py-4">
          {cart.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="size-11 text-gray-300" />
              <p className="mt-3 font-bold">Giỏ hàng đang trống</p>
              <p className="mt-1 text-sm text-gray-500">Chọn món trong menu để bắt đầu đặt món.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <article key={item.menuItemId} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                  <div className="flex gap-3">
                    <Link
                      href={PATH.customer.sessionMenuItem(sessionCode, item.menuItemId)}
                      onClick={() => onOpenChange(false)}
                      className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-gray-100"
                    >
                      <Image
                        src={item.imageUrl || FALLBACK_IMAGE}
                        alt={item.menuItemName}
                        fill
                        unoptimized
                        sizes="64px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={PATH.customer.sessionMenuItem(sessionCode, item.menuItemId)}
                        onClick={() => onOpenChange(false)}
                        className="line-clamp-2 font-bold text-gray-900"
                      >
                        {item.menuItemName}
                      </Link>
                      <p className="text-primary-container mt-1 text-sm font-bold">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 self-start">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => void onQuantityChange(item, -1)}
                        className="text-primary-container flex size-8 items-center justify-center rounded-full border border-orange-100 bg-orange-50 disabled:opacity-50"
                        aria-label={`Giảm ${item.menuItemName}`}
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="min-w-4 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => void onQuantityChange(item, 1)}
                        className="bg-primary-container flex size-8 items-center justify-center rounded-full text-white disabled:opacity-50"
                        aria-label={`Tăng ${item.menuItemName}`}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                  <Textarea
                    value={item.specialRequest ?? ""}
                    onChange={(event) => void onNoteChange(item.menuItemId, event.target.value)}
                    placeholder="Ghi chú cho món: ít cay, không hành..."
                    className="mt-3 min-h-14 resize-none rounded-xl bg-gray-50"
                  />
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 bg-white px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500">Tổng cộng</span>
            <span className="text-primary-container text-xl font-black">{formatCurrency(cart.totalAmount)}</span>
          </div>
          <div className="flex gap-3">
            {cart.items.length > 0 ? (
              <Button variant="outline" size="icon-lg" onClick={() => void onClear()} disabled={isUpdating} aria-label="Xóa giỏ hàng">
                <Trash2 className="size-4" />
              </Button>
            ) : null}
            <Button asChild className="h-11 flex-1 rounded-xl" disabled={cart.items.length === 0 || isUpdating}>
              <Link
                href={PATH.customer.sessionCheckout(sessionCode)}
                onClick={(event) => {
                  if (cart.items.length === 0 || isUpdating) {
                    event.preventDefault();
                    return;
                  }

                  onOpenChange(false);
                }}
              >
                Xác nhận đơn
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

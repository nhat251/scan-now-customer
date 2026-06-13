"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight,Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PATH } from "@/constants/path";
import { cn } from "@/lib/utils";
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
        overlayClassName="z-[80] bg-black/40 backdrop-blur-sm"
        className="data-[state=open]:slide-in-from-bottom-10 data-[state=closed]:slide-out-to-bottom-10 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 bg-surface-container-lowest top-auto bottom-0 left-1/2 z-[90] flex h-[80dvh] max-h-[800px] max-w-[480px] -translate-x-1/2 translate-y-0 flex-col gap-0 rounded-t-[2rem] rounded-b-none border-0 p-0 shadow-2xl duration-300"
      >
        <div className="bg-outline-variant/50 mx-auto mt-3 h-1.5 w-12 rounded-full" />
        <DialogHeader className="border-outline-variant/30 flex-row items-center justify-between gap-3 border-b px-5 pt-4 pb-4 text-left">
          <div>
            <DialogTitle className="font-headline-sm text-headline-sm text-on-surface">Giỏ hàng của bạn</DialogTitle>
            <DialogDescription className="font-label-sm text-on-surface-variant mt-1 flex items-center gap-1.5">
              <span className="bg-primary-container text-on-primary-container inline-flex h-5 items-center justify-center rounded-full px-2 text-[11px] font-bold">
                {totalItems} món
              </span>
              thêm ghi chú trước khi gửi đơn
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button aria-label="Đóng giỏ hàng" className="bg-surface-variant text-on-surface hover:bg-outline-variant/50 flex h-10 w-10 items-center justify-center rounded-full transition-colors">
              <X className="size-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="bg-surface/50 min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {cart.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <div className="bg-surface-variant text-on-surface-variant mb-4 flex size-20 items-center justify-center rounded-full">
                <ShoppingBag className="size-10" />
              </div>
              <p className="font-headline-sm text-on-surface">Giỏ hàng đang trống</p>
              <p className="font-body-sm text-on-surface-variant mt-1">Chọn món trong menu để bắt đầu đặt món.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cart.items.map((item) => (
                <article key={item.menuItemId} className="border-outline-variant/30 flex flex-col gap-3 rounded-2xl border bg-white p-3 shadow-sm">
                  <div className="flex gap-3">
                    <Link
                      href={PATH.customer.sessionMenuItem(sessionCode, item.menuItemId)}
                      onClick={() => onOpenChange(false)}
                      className="bg-surface-variant relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl"
                    >
                      <Image
                        src={item.imageUrl || FALLBACK_IMAGE}
                        alt={item.menuItemName}
                        fill
                        unoptimized
                        sizes="72px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <Link
                        href={PATH.customer.sessionMenuItem(sessionCode, item.menuItemId)}
                        onClick={() => onOpenChange(false)}
                        className="font-headline-sm text-on-surface line-clamp-1 text-base"
                      >
                        {item.menuItemName}
                      </Link>
                      <div className="flex items-center justify-between">
                        <p className="font-headline-sm text-primary">{formatCurrency(item.price)}</p>
                        <div className="border-primary/20 bg-surface flex items-center gap-2 rounded-full border px-1 py-1">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => void onQuantityChange(item, -1)}
                            className="border-primary/30 text-primary hover:bg-surface-container flex size-7 items-center justify-center rounded-full border bg-white shadow-sm transition-all active:scale-90 disabled:opacity-50"
                            aria-label={`Giảm ${item.menuItemName}`}
                          >
                            <Minus className="size-3.5" strokeWidth={2.5} />
                          </button>
                          <span className="font-label-md text-on-surface min-w-4 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => void onQuantityChange(item, 1)}
                            className="bg-primary hover:bg-primary/90 flex size-7 items-center justify-center rounded-full text-white shadow-sm transition-all active:scale-90 disabled:opacity-50"
                            aria-label={`Tăng ${item.menuItemName}`}
                          >
                            <Plus className="size-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={item.specialRequest ?? ""}
                    onChange={(event) => void onNoteChange(item.menuItemId, event.target.value)}
                    placeholder="Ghi chú: ít cay, không hành..."
                    className="bg-surface-container-low font-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-primary-container/30 min-h-[48px] w-full resize-none rounded-xl border-none p-3 transition-all outline-none focus:ring-2"
                    disabled={isUpdating}
                  />
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="border-outline-variant/30 bg-surface-container-lowest z-10 border-t px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
          {cart.items.length > 0 && (
            <div className="bg-surface-container-low mb-4 flex flex-col gap-2 rounded-xl p-4">
              <div className="font-body-sm flex items-center justify-between">
                <span className="text-on-surface-variant">Tạm tính ({totalItems} món)</span>
                <span className="text-on-surface">{formatCurrency(cart.totalAmount)}</span>
              </div>
              <div className="border-outline-variant/30 mt-1 flex items-center justify-between border-t pt-2">
                <span className="font-headline-sm text-on-surface text-base">Tổng cộng</span>
                <span className="font-headline-sm text-primary text-xl">{formatCurrency(cart.totalAmount)}</span>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            {cart.items.length > 0 ? (
              <button
                type="button"
                onClick={() => void onClear()}
                disabled={isUpdating}
                aria-label="Xóa giỏ hàng"
                className="border-error/30 bg-error-container text-error hover:bg-error active-scale flex w-[60px] shrink-0 items-center justify-center rounded-2xl border transition-colors hover:text-white disabled:opacity-50"
              >
                <Trash2 className="size-5" />
              </button>
            ) : null}
            <Link
              href={PATH.customer.sessionCheckout(sessionCode)}
              onClick={(event) => {
                if (cart.items.length === 0 || isUpdating) {
                  event.preventDefault();
                  return;
                }
                onOpenChange(false);
              }}
              className={cn(
                "font-headline-sm flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl text-base transition-all",
                cart.items.length === 0 || isUpdating
                  ? "bg-surface-variant text-on-surface-variant cursor-not-allowed"
                  : "bg-primary shadow-primary/25 active-scale text-white shadow-lg hover:brightness-110"
              )}
            >
              Tiếp tục đặt món
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

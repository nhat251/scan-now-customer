"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PATH } from "@/constants/path";
import type { CartDto, CartItemDto } from "@/types/cart";
import { cn } from "@/lib/utils";

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
        className="data-[state=open]:slide-in-from-bottom-10 data-[state=closed]:slide-out-to-bottom-10 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 top-auto bottom-0 left-1/2 z-[90] flex h-[80dvh] max-h-[800px] max-w-[480px] -translate-x-1/2 translate-y-0 flex-col gap-0 rounded-t-[2rem] rounded-b-none border-0 bg-surface-container-lowest p-0 shadow-2xl duration-300"
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-outline-variant/50" />
        <DialogHeader className="flex-row items-center justify-between gap-3 border-b border-outline-variant/30 px-5 pt-4 pb-4 text-left">
          <div>
            <DialogTitle className="font-headline-sm text-headline-sm text-on-surface">Giỏ hàng của bạn</DialogTitle>
            <DialogDescription className="mt-1 flex items-center gap-1.5 font-label-sm text-on-surface-variant">
              <span className="inline-flex h-5 items-center justify-center rounded-full bg-primary-container px-2 text-[11px] font-bold text-on-primary-container">
                {totalItems} món
              </span>
              thêm ghi chú trước khi gửi đơn
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button aria-label="Đóng giỏ hàng" className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-variant text-on-surface hover:bg-outline-variant/50 transition-colors">
              <X className="size-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 bg-surface/50">
          {cart.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-8">
              <div className="flex size-20 items-center justify-center rounded-full bg-surface-variant mb-4 text-on-surface-variant">
                <ShoppingBag className="size-10" />
              </div>
              <p className="font-headline-sm text-on-surface">Giỏ hàng đang trống</p>
              <p className="mt-1 font-body-sm text-on-surface-variant">Chọn món trong menu để bắt đầu đặt món.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cart.items.map((item) => (
                <article key={item.menuItemId} className="bg-white rounded-2xl p-3 shadow-sm border border-outline-variant/30 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Link
                      href={PATH.customer.sessionMenuItem(sessionCode, item.menuItemId)}
                      onClick={() => onOpenChange(false)}
                      className="relative w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden bg-surface-variant"
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
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <Link
                        href={PATH.customer.sessionMenuItem(sessionCode, item.menuItemId)}
                        onClick={() => onOpenChange(false)}
                        className="font-headline-sm text-base text-on-surface line-clamp-1"
                      >
                        {item.menuItemName}
                      </Link>
                      <div className="flex items-center justify-between">
                        <p className="font-headline-sm text-primary">{formatCurrency(item.price)}</p>
                        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-surface px-1 py-1">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => void onQuantityChange(item, -1)}
                            className="flex size-7 items-center justify-center rounded-full border border-primary/30 bg-white text-primary shadow-sm transition-all disabled:opacity-50 hover:bg-surface-container active:scale-90"
                            aria-label={`Giảm ${item.menuItemName}`}
                          >
                            <Minus className="size-3.5" strokeWidth={2.5} />
                          </button>
                          <span className="min-w-4 text-center font-label-md text-on-surface">{item.quantity}</span>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => void onQuantityChange(item, 1)}
                            className="flex size-7 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-all disabled:opacity-50 hover:bg-primary/90 active:scale-90"
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
                    className="w-full bg-surface-container-low border-none rounded-xl p-3 font-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary-container/30 transition-all min-h-[48px] resize-none outline-none"
                    disabled={isUpdating}
                  />
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-outline-variant/30 bg-surface-container-lowest px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-10">
          {cart.items.length > 0 && (
            <div className="mb-4 flex flex-col gap-2 rounded-xl bg-surface-container-low p-4">
              <div className="flex items-center justify-between font-body-sm">
                <span className="text-on-surface-variant">Tạm tính ({totalItems} món)</span>
                <span className="text-on-surface">{formatCurrency(cart.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-outline-variant/30 pt-2 mt-1">
                <span className="font-headline-sm text-base text-on-surface">Tổng cộng</span>
                <span className="font-headline-sm text-xl text-primary">{formatCurrency(cart.totalAmount)}</span>
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
                className="w-[60px] flex shrink-0 items-center justify-center rounded-2xl border border-error/30 bg-error-container text-error hover:bg-error hover:text-white transition-colors disabled:opacity-50 active-scale"
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
                "h-14 flex-1 rounded-2xl flex items-center justify-center gap-2 font-headline-sm text-base transition-all",
                cart.items.length === 0 || isUpdating
                  ? "bg-surface-variant text-on-surface-variant cursor-not-allowed"
                  : "bg-primary text-white shadow-lg shadow-primary/25 hover:brightness-110 active-scale"
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

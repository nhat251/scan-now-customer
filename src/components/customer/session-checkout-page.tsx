"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, ShoppingBag, Utensils, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PATH } from "@/constants/path";
import { usePlacePublicOrderMutation } from "@/hooks/mutations/useOrderMutations";
import { recalculateCart, useSharedCart } from "@/hooks/useSharedCart";
import type { PersistedCustomerSession } from "@/types/customer-session";
import { cn } from "@/lib/utils";

import {
  formatCurrency,
  getCustomerApiErrorMessage,
  persistCustomerOrder,
  readPersistedCustomerSession,
} from "./customer-session-utils";

type Props = {
  sessionCode: string;
};

export const SessionCheckoutPage = ({ sessionCode }: Props) => {
  const router = useRouter();
  const normalizedSessionCode = sessionCode.toUpperCase();
  const [session, setSession] = useState<PersistedCustomerSession | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [formError, setFormError] = useState("");
  const { cart, status: cartStatus, isUpdating, updateCart, clearCart } = useSharedCart(normalizedSessionCode);
  const placeOrderMutation = usePlacePublicOrderMutation();

  useEffect(() => {
    setSession(readPersistedCustomerSession());
  }, []);

  const totalQuantity = cart.items.reduce((total, item) => total + item.quantity, 0);
  const cannotSubmit =
    totalQuantity === 0 ||
    isUpdating ||
    placeOrderMutation.isPending ||
    cartStatus === "connecting" ||
    cartStatus === "reconnecting";

  const updateSpecialRequest = async (menuItemId: string, specialRequest: string) => {
    await updateCart(
      recalculateCart({
        ...cart,
        items: cart.items.map((item) =>
          item.menuItemId === menuItemId ? { ...item, specialRequest: specialRequest || null } : item
        ),
      })
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (cart.items.length === 0) {
      setFormError("Giỏ hàng đang trống. Vui lòng chọn món trước khi gửi đơn.");
      return;
    }

    try {
      const response = await placeOrderMutation.mutateAsync({
        sessionCode: normalizedSessionCode,
        request: {
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
          customerNote: customerNote.trim() || null,
          items: cart.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            note: item.specialRequest?.trim() || null,
          })),
        },
      });

      persistCustomerOrder(normalizedSessionCode, response.result.orderId);
      await clearCart();
      router.replace(PATH.customer.sessionOrder(normalizedSessionCode, response.result.orderId));
    } catch (error) {
      setFormError(getCustomerApiErrorMessage(error, "Không thể gửi đơn lúc này. Vui lòng kiểm tra giỏ hàng và thử lại."));
    }
  };

  return (
    <main className="bg-background text-on-surface font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen pb-32 max-w-[480px] mx-auto">
      {/* 1. Sticky Header */}
      <header className="sticky top-0 z-50 w-full h-16 bg-surface/95 backdrop-blur-xl flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link 
            href={PATH.customer.sessionMenu(normalizedSessionCode)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-95 duration-150"
          >
            <ChevronLeft className="text-primary size-6" />
          </Link>
          <span className="font-headline-md text-headline-md font-bold text-primary">ScanNow</span>
        </div>
        <div className="bg-primary-container/10 border border-primary-container/20 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Utensils className="text-primary size-[18px]" />
          <span className="font-label-md text-label-md text-on-primary-container">{session ? `Bàn ${session.tableNumber}` : normalizedSessionCode}</span>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-4 pt-6 flex flex-col gap-6">
        {/* Hero Banner */}
        <section>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#f97316] to-[#d84315] rounded-3xl p-6 text-white shadow-lg shadow-primary/20">
            <div className="relative z-10">
              <p className="font-label-sm tracking-wider uppercase opacity-90 mb-1 text-white">Bước 2/3</p>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold mb-2 text-white">Xác nhận đơn món</h1>
              <p className="font-body-sm opacity-90 max-w-[80%] text-white">
                {session?.branchName ?? "ScanNow"} · Bàn {session?.tableNumber ?? "-"}
              </p>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -right-4 top-2 w-20 h-20 border-4 border-white/10 rounded-full"></div>
          </div>
        </section>

        {/* Ordered Items */}
        <section className="flex flex-col gap-4">
          {cart.items.length > 0 ? (
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Món đã chọn</h2>
          ) : null}

          {cart.items.length === 0 ? (
            <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-center shadow-sm">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-surface-variant mb-4 text-on-surface-variant">
                <ShoppingBag className="size-8" />
              </div>
              <h2 className="font-headline-sm text-on-surface">Giỏ hàng đang trống</h2>
              <p className="mt-2 font-body-sm text-on-surface-variant">Thêm món từ thực đơn để gửi yêu cầu đến nhân viên.</p>
            </div>
          ) : null}

          {cart.items.map((item) => (
            <article key={item.menuItemId} className="bg-white rounded-3xl p-5 shadow-sm border border-outline-variant/30 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-headline-sm text-base text-on-surface">{item.menuItemName}</h2>
                  <p className="mt-1 font-body-sm text-on-surface-variant">
                    {item.quantity} × {formatCurrency(item.price)}
                  </p>
                </div>
                <p className="shrink-0 font-headline-sm text-base text-primary">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
              <textarea
                value={item.specialRequest ?? ""}
                onChange={(event) => void updateSpecialRequest(item.menuItemId, event.target.value)}
                placeholder="Ghi chú cho món này: ít cay, không hành..."
                className="w-full bg-surface-container-low border-none rounded-xl p-3 font-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary-container/30 transition-all min-h-[48px] resize-none outline-none mt-2"
                disabled={isUpdating}
              />
            </article>
          ))}
        </section>

        {/* Customer Info Card */}
        <section className="flex flex-col gap-4 pb-6">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-outline-variant/30">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Thông tin đơn hàng</h2>
            <p className="mt-1 font-body-sm text-on-surface-variant">
              Thông tin liên hệ là tùy chọn để nhân viên hỗ trợ thuận tiện hơn.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Tên khách (tùy chọn)"
                className="h-14 w-full bg-surface-container-low border-none rounded-2xl px-4 font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary-container/30 transition-all outline-none"
              />
              <input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="Số điện thoại (tùy chọn)"
                inputMode="tel"
                className="h-14 w-full bg-surface-container-low border-none rounded-2xl px-4 font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary-container/30 transition-all outline-none"
              />
              <textarea
                value={customerNote}
                onChange={(event) => setCustomerNote(event.target.value)}
                placeholder="Ghi chú chung cho đơn hàng"
                className="min-h-[100px] w-full bg-surface-container-low border-none rounded-2xl p-4 font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary-container/30 transition-all resize-none outline-none"
              />
            </div>
          </div>
          {formError ? (
            <p className="rounded-2xl bg-error-container p-4 text-sm font-semibold text-error text-center">{formError}</p>
          ) : null}
        </section>

        {/* Fixed Footer */}
        <footer className="fixed right-0 bottom-0 left-0 z-[70] bg-surface/80 backdrop-blur-2xl px-4 py-4 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] border-t border-outline-variant/30">
          <div className="mx-auto flex max-w-[480px] items-center justify-between gap-4">
            <div className="flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">
                {totalQuantity} món · Tổng cộng
              </p>
              <p className="font-headline-sm text-xl text-primary">{formatCurrency(cart.totalAmount)}</p>
            </div>
            <button
              type="submit"
              disabled={cannotSubmit}
              className="h-14 px-8 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center gap-2 font-headline-sm text-base shadow-md shadow-primary-container/20 hover:brightness-110 active-scale transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {placeOrderMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : null}
              Gửi đơn món
            </button>
          </div>
        </footer>
      </form>
    </main>
  );
};

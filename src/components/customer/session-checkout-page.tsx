"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, ShoppingBag, Utensils } from "lucide-react";
import { useForm } from "react-hook-form";

import { PATH } from "@/constants/path";
import { usePlacePublicOrderMutation } from "@/hooks/mutations/useOrderMutations";
import { recalculateCart, useSharedCart } from "@/hooks/useSharedCart";
import type { PersistedCustomerSession } from "@/types/customer-session";

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
  const [formError, setFormError] = useState("");
  const {
    cart,
    status: cartStatus,
    isUpdating,
    updateCart,
    clearCart,
  } = useSharedCart(normalizedSessionCode);
  const placeOrderMutation = usePlacePublicOrderMutation();

  const { register, getValues } = useForm({
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerNote: "",
    },
  });

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
          item.menuItemId === menuItemId
            ? { ...item, specialRequest: specialRequest || null }
            : item
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

    const values = getValues();

    try {
      const response = await placeOrderMutation.mutateAsync({
        sessionCode: normalizedSessionCode,
        request: {
          customerName: values.customerName.trim() || null,
          customerPhone: values.customerPhone.trim() || null,
          customerNote: values.customerNote.trim() || null,
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
      setFormError(
        getCustomerApiErrorMessage(
          error,
          "Không thể gửi đơn lúc này. Vui lòng kiểm tra giỏ hàng và thử lại."
        )
      );
    }
  };

  return (
    <main className="bg-background text-on-surface font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed mx-auto min-h-screen max-w-[480px] pb-32">
      {/* 1. Sticky Header */}
      <header className="bg-surface/95 sticky top-0 z-50 flex h-16 w-full items-center justify-between px-4 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href={PATH.customer.sessionMenu(normalizedSessionCode)}
            className="hover:bg-surface-container-high flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 active:scale-95"
          >
            <ChevronLeft className="text-primary size-6" />
          </Link>
          <span className="font-headline-md text-headline-md text-primary font-bold">ScanNow</span>
        </div>
        <div className="bg-primary-container/10 border-primary-container/20 flex items-center gap-1.5 rounded-full border px-3 py-1.5">
          <Utensils className="text-primary size-[18px]" />
          <span className="font-label-md text-label-md text-on-primary-container">
            {session ? `Bàn ${session.tableNumber}` : normalizedSessionCode}
          </span>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-4 pt-6">
        {/* Hero Banner */}
        <section>
          <div className="shadow-primary/20 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#f97316] to-[#d84315] p-6 text-white shadow-lg">
            <div className="relative z-10">
              <p className="font-label-sm mb-1 tracking-wider text-white uppercase opacity-90">
                Bước 2/3
              </p>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile mb-2 font-extrabold text-white">
                Xác nhận đơn món
              </h1>
              <p className="font-body-sm max-w-[80%] text-white opacity-90">
                {session?.branchName ?? "ScanNow"} · Bàn {session?.tableNumber ?? "-"}
              </p>
            </div>
            <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute top-2 -right-4 h-20 w-20 rounded-full border-4 border-white/10"></div>
          </div>
        </section>

        {/* Ordered Items */}
        <section className="flex flex-col gap-4">
          {cart.items.length > 0 ? (
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Món đã chọn</h2>
          ) : null}

          {cart.items.length === 0 ? (
            <div className="border-outline-variant/30 bg-surface-container-lowest rounded-3xl border p-8 text-center shadow-sm">
              <div className="bg-surface-variant text-on-surface-variant mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
                <ShoppingBag className="size-8" />
              </div>
              <h2 className="font-headline-sm text-on-surface">Giỏ hàng đang trống</h2>
              <p className="font-body-sm text-on-surface-variant mt-2">
                Thêm món từ thực đơn để gửi yêu cầu đến nhân viên.
              </p>
            </div>
          ) : null}

          {cart.items.map((item) => (
            <article
              key={item.menuItemId}
              className="border-outline-variant/30 flex flex-col gap-3 rounded-3xl border bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-headline-sm text-on-surface text-base">
                    {item.menuItemName}
                  </h2>
                  <p className="font-body-sm text-on-surface-variant mt-1">
                    {item.quantity} × {formatCurrency(item.price)}
                  </p>
                </div>
                <p className="font-headline-sm text-primary shrink-0 text-base">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
              <textarea
                value={item.specialRequest ?? ""}
                onChange={(event) => void updateSpecialRequest(item.menuItemId, event.target.value)}
                placeholder="Ghi chú cho món này: ít cay, không hành..."
                className="bg-surface-container-low font-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-primary-container/30 mt-2 min-h-[48px] w-full resize-none rounded-xl border-none p-3 transition-all outline-none focus:ring-2"
                disabled={isUpdating}
              />
            </article>
          ))}
        </section>

        {/* Customer Info Card */}
        <section className="flex flex-col gap-4 pb-6">
          <div className="border-outline-variant/30 rounded-3xl border bg-white p-5 shadow-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Thông tin đơn hàng
            </h2>
            <p className="font-body-sm text-on-surface-variant mt-1">
              Thông tin liên hệ là tùy chọn để nhân viên hỗ trợ thuận tiện hơn.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <input
                placeholder="Tên khách (tùy chọn)"
                className="bg-surface-container-low font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:ring-primary-container/30 h-14 w-full rounded-2xl border-none px-4 transition-all outline-none focus:ring-2"
                {...register("customerName")}
              />
              <input
                placeholder="Số điện thoại (tùy chọn)"
                inputMode="tel"
                className="bg-surface-container-low font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:ring-primary-container/30 h-14 w-full rounded-2xl border-none px-4 transition-all outline-none focus:ring-2"
                {...register("customerPhone")}
              />
              <textarea
                placeholder="Ghi chú chung cho đơn hàng"
                className="bg-surface-container-low font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:ring-primary-container/30 min-h-[100px] w-full resize-none rounded-2xl border-none p-4 transition-all outline-none focus:ring-2"
                {...register("customerNote")}
              />
            </div>
          </div>
          {formError ? (
            <p className="bg-error-container text-error rounded-2xl p-4 text-center text-sm font-semibold">
              {formError}
            </p>
          ) : null}
        </section>

        {/* Fixed Footer */}
        <footer className="bg-surface/80 border-outline-variant/30 fixed right-0 bottom-0 left-0 z-[70] border-t px-4 py-4 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] backdrop-blur-2xl">
          <div className="mx-auto flex max-w-[480px] items-center justify-between gap-4">
            <div className="flex flex-col justify-center">
              <p className="text-on-surface-variant mb-0.5 text-[10px] font-bold tracking-widest uppercase">
                {totalQuantity} món · Tổng cộng
              </p>
              <p className="font-headline-sm text-primary text-xl">
                {formatCurrency(cart.totalAmount)}
              </p>
            </div>
            <button
              type="submit"
              disabled={cannotSubmit}
              className="bg-primary-container text-on-primary-container font-headline-sm shadow-primary-container/20 active-scale flex h-14 items-center justify-center gap-2 rounded-2xl px-8 text-base shadow-md transition-all hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
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

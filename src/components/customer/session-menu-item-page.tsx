"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Clock3, Loader2, Minus, Plus, ShoppingBag, StickyNote, Utensils } from "lucide-react";

import { Logo } from "@/components/atoms/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PATH } from "@/constants/path";
import { usePublicMenuItemQuery } from "@/hooks/queries/usePublicCustomerQueries";
import { recalculateCart, useSharedCart } from "@/hooks/useSharedCart";
import { showNotify } from "@/stores/global";
import type { CartItemDto } from "@/types/cart";
import type { PersistedCustomerSession } from "@/types/customer-session";

import { formatCurrency, getCustomerApiErrorMessage, readPersistedCustomerSession } from "./customer-session-utils";

type Props = {
  sessionCode: string;
  menuItemId: string;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80";

export const SessionMenuItemPage = ({ sessionCode, menuItemId }: Props) => {
  const normalizedSessionCode = sessionCode.toUpperCase();
  const [session, setSession] = useState<PersistedCustomerSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [note, setNote] = useState("");
  const { cart, isUpdating, updateCart } = useSharedCart(normalizedSessionCode);

  useEffect(() => {
    const storedSession = readPersistedCustomerSession();

    if (storedSession?.sessionCode.toUpperCase() === normalizedSessionCode) {
      setSession(storedSession);
    }

    setSessionLoaded(true);
  }, [normalizedSessionCode]);

  const itemQuery = usePublicMenuItemQuery(session?.branchId, menuItemId);
  const item = itemQuery.data;
  const cartLine = cart.items.find((line) => line.menuItemId === menuItemId);
  const quantity = cartLine?.quantity ?? 0;

  useEffect(() => {
    setNote(cartLine?.specialRequest ?? "");
  }, [cartLine?.specialRequest]);

  const setCartQuantity = async (nextQuantity: number) => {
    if (!item) {
      return;
    }

    const nextItems = cart.items.filter((line) => line.menuItemId !== item.menuItemId);

    if (nextQuantity > 0) {
      const nextLine: CartItemDto = {
        menuItemId: item.menuItemId,
        menuItemName: item.name,
        price: item.price,
        quantity: nextQuantity,
        specialRequest: note.trim() || null,
        imageUrl: item.imageUrl || null,
      };

      nextItems.push(nextLine);
    }

    await updateCart(recalculateCart({ items: nextItems, totalAmount: 0 }));
  };

  const handleSaveToCart = async () => {
    await setCartQuantity(quantity || 1);
    showNotify({
      type: "success",
      message: quantity > 0 ? "Đã cập nhật món trong giỏ hàng." : "Đã thêm món vào giỏ hàng.",
    });
  };

  return (
    <main className="fixed inset-0 z-[60] overflow-y-auto bg-gradient-to-b from-orange-50/70 via-[#f8f9fa] to-[#f8f9fa] font-sans text-gray-900">
      <div className="mx-auto min-h-full w-full max-w-md pb-28">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-orange-50 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md">
          <Logo size={16} textSize="text-xl" />
          <div className="text-primary-container flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-sm font-bold">
            <Utensils className="size-4" />
            {session ? `Bàn ${session.tableNumber}` : "Menu"}
          </div>
        </header>

        <section className="px-4 pt-4">
          <Button asChild variant="ghost" className="-ml-4 px-4">
            <Link href={PATH.customer.sessionMenu(normalizedSessionCode)}>
              <ArrowLeft className="size-4" />
              Quay lại menu
            </Link>
          </Button>
        </section>

        {!sessionLoaded || itemQuery.isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Loader2 className="text-primary-container size-8 animate-spin" />
          </div>
        ) : null}

        {sessionLoaded && !session ? (
          <section className="mx-4 mt-4 rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <AlertCircle className="text-destructive mx-auto size-10" />
            <h1 className="mt-3 text-xl font-bold">Phiên đặt món không còn khả dụng</h1>
            <p className="mt-2 text-sm text-gray-500">Vui lòng quay lại menu từ mã QR của bàn.</p>
          </section>
        ) : null}

        {itemQuery.isError ? (
          <section className="mx-4 mt-4 rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <AlertCircle className="text-destructive mx-auto size-10" />
            <h1 className="mt-3 text-xl font-bold">Không thể tải món ăn</h1>
            <p className="mt-2 text-sm text-gray-500">
              {getCustomerApiErrorMessage(itemQuery.error, "Món ăn không tồn tại hoặc không còn phục vụ.")}
            </p>
            <Button className="mt-5" onClick={() => itemQuery.refetch()} disabled={itemQuery.isRefetching}>
              Thử lại
            </Button>
          </section>
        ) : null}

        {item ? (
          <>
            <section className="mt-3 px-4">
              <div className="overflow-hidden rounded-3xl border border-orange-100/80 bg-white shadow-md shadow-orange-100/40">
                <div className="relative h-64 w-full bg-gray-100">
                  <Image
                    src={item.imageUrl || FALLBACK_IMAGE}
                    alt={item.name}
                    fill
                    unoptimized
                    sizes="448px"
                    className={item.isAvailable ? "object-cover" : "object-cover opacity-60 grayscale"}
                  />
                  {item.isFeatured ? (
                    <span className="bg-primary-container absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-black text-white">
                      NỔI BẬT
                    </span>
                  ) : null}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">{item.categoryName ?? "Món ăn"}</p>
                      <h1 className="mt-2 text-2xl font-black">{item.name}</h1>
                    </div>
                    <span className="text-primary-container shrink-0 text-xl font-black">{formatCurrency(item.price)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-500">
                    {item.description || "Món được chuẩn bị tươi mới tại nhà hàng."}
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm font-semibold text-gray-700">
                    <Clock3 className="text-primary-container size-4" />
                    Thời gian chuẩn bị dự kiến: {item.preparationTime} phút
                  </div>
                  {!item.isAvailable ? (
                    <p className="mt-4 rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-500">
                      Món này hiện đang hết hàng.
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="mt-4 px-4">
              <div className="rounded-2xl border border-orange-100/80 bg-white p-4 shadow-sm">
                <label htmlFor="menu-item-note" className="flex items-center gap-2 text-sm font-bold">
                  <StickyNote className="text-primary-container size-4" />
                  Ghi chú cho món
                </label>
                <Textarea
                  id="menu-item-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  onBlur={() => {
                    if (quantity > 0) {
                      void setCartQuantity(quantity);
                    }
                  }}
                  placeholder="Ví dụ: ít cay, không hành, không đá..."
                  className="mt-3 min-h-20 resize-none rounded-xl bg-gray-50"
                />
                <p className="mt-2 text-xs text-gray-500">Ghi chú sẽ được gửi riêng cho món này.</p>
              </div>
            </section>
          </>
        ) : null}
      </div>

      {item ? (
        <footer className="fixed right-0 bottom-0 left-0 z-[70] border-t border-gray-100 bg-white/95 p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md">
          <div className="mx-auto flex max-w-md items-center gap-3">
            {quantity > 0 ? (
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => void setCartQuantity(Math.max(quantity - 1, 0))}
                  className="text-primary-container flex size-8 items-center justify-center rounded-full"
                  aria-label={`Giảm ${item.name}`}
                >
                  <Minus className="size-5" />
                </button>
                <span className="min-w-4 text-center font-bold">{quantity}</span>
                <button
                  type="button"
                  disabled={isUpdating || !item.isAvailable}
                  onClick={() => void setCartQuantity(quantity + 1)}
                  className="text-primary-container flex size-8 items-center justify-center rounded-full"
                  aria-label={`Tăng ${item.name}`}
                >
                  <Plus className="size-5" />
                </button>
              </div>
            ) : null}
            <Button
              className="h-12 flex-1 rounded-2xl"
              onClick={() => void handleSaveToCart()}
              disabled={!item.isAvailable || isUpdating}
            >
              <ShoppingBag className="size-5" />
              {quantity > 0 ? "Cập nhật ghi chú" : "Thêm vào giỏ"}
            </Button>
          </div>
        </footer>
      ) : null}
    </main>
  );
};

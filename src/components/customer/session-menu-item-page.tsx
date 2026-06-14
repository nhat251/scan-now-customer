"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  Clock,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  StickyNote,
  Utensils,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { usePublicMenuItemQuery } from "@/hooks/queries/usePublicCustomerQueries";
import { recalculateCart, useSharedCart } from "@/hooks/useSharedCart";
import { cn } from "@/lib/utils";
import { showNotify } from "@/stores/global";
import type { CartItemDto } from "@/types/cart";
import type { PersistedCustomerSession } from "@/types/customer-session";

import {
  formatCurrency,
  getCustomerApiErrorMessage,
  readPersistedCustomerSession,
} from "./customer-session-utils";

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
  const { cart, isUpdating, updateCart } = useSharedCart(normalizedSessionCode);

  const { control, register, setValue, getValues, reset } = useForm({
    defaultValues: {
      note: "",
      localQuantity: 1,
    },
  });

  const watched = useWatch({ control });
  const localQuantity = watched.localQuantity ?? 1;

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
    reset({
      note: cartLine?.specialRequest ?? "",
      localQuantity: Math.max(cartLine?.quantity ?? 1, 1),
    });
  }, [cartLine, reset]);

  const handleSaveToCart = async () => {
    if (!item) return;

    const values = getValues();
    const currentQuantity = values.localQuantity;
    const currentNote = values.note;

    const nextItems = cart.items.filter((line) => line.menuItemId !== item.menuItemId);

    if (currentQuantity > 0) {
      const nextLine: CartItemDto = {
        menuItemId: item.menuItemId,
        menuItemName: item.name,
        price: item.price,
        quantity: currentQuantity,
        specialRequest: currentNote.trim() || null,
        imageUrl: item.imageUrl || null,
      };
      nextItems.push(nextLine);
    }

    await updateCart(recalculateCart({ items: nextItems, totalAmount: 0 }));

    showNotify({
      type: "success",
      message:
        currentQuantity > 0 ? "Đã cập nhật món trong giỏ hàng." : "Đã thêm món vào giỏ hàng.",
    });
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
            {session ? `Bàn ${session.tableNumber}` : "Bàn"}
          </span>
        </div>
      </header>

      {/* Loading state */}
      {!sessionLoaded || itemQuery.isLoading ? (
        <div className="flex min-h-72 items-center justify-center">
          <Loader2 className="text-primary size-8 animate-spin" />
        </div>
      ) : null}

      {/* Session not found */}
      {sessionLoaded && !session ? (
        <section className="border-outline-variant/30 bg-surface-container-lowest mx-4 mt-4 rounded-2xl border p-8 text-center shadow-sm">
          <AlertCircle className="text-error mx-auto size-10" />
          <h1 className="mt-3 text-xl font-bold">Phiên đặt món không còn khả dụng</h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            Vui lòng quay lại menu từ mã QR của bàn.
          </p>
        </section>
      ) : null}

      {/* Error state */}
      {itemQuery.isError ? (
        <section className="border-outline-variant/30 bg-surface-container-lowest mx-4 mt-4 rounded-2xl border p-8 text-center shadow-sm">
          <AlertCircle className="text-error mx-auto size-10" />
          <h1 className="mt-3 text-xl font-bold">Không thể tải món ăn</h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            {getCustomerApiErrorMessage(
              itemQuery.error,
              "Món ăn không tồn tại hoặc không còn phục vụ."
            )}
          </p>
          <Button
            className="bg-primary mt-5 text-white"
            onClick={() => itemQuery.refetch()}
            disabled={itemQuery.isRefetching}
          >
            Thử lại
          </Button>
        </section>
      ) : null}

      {/* Item content */}
      {item ? (
        <>
          {/* 2. Food Hero Image */}
          <section className="relative h-[280px] w-full overflow-hidden">
            <Image
              src={item.imageUrl || FALLBACK_IMAGE}
              alt={item.name}
              fill
              unoptimized
              sizes="480px"
              className={cn(
                "object-cover transition-transform duration-300",
                !item.isAvailable && "opacity-60 grayscale"
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            {/* Badge */}
            {item.isFeatured ? (
              <div className="bg-primary text-on-primary font-label-md text-label-md absolute top-4 left-4 rounded-lg px-3 py-1 shadow-lg">
                NỔI BẬT
              </div>
            ) : null}
            {!item.isAvailable ? (
              <div className="bg-surface-container-highest text-on-surface font-label-md text-label-md absolute top-4 right-4 rounded-lg px-3 py-1 opacity-90 shadow-lg">
                HẾT HÀNG
              </div>
            ) : null}
          </section>

          {/* 3. Sliding Info Card */}
          <section className="relative -mt-6 px-4">
            <div className="bg-surface-container-lowest border-outline-variant/10 rounded-3xl border p-6 shadow-lg">
              <div className="flex flex-col gap-2">
                <span className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">
                  {item.categoryName ?? "Món ăn"}
                </span>
                <div className="flex items-start justify-between gap-4">
                  <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface leading-tight">
                    {item.name}
                  </h1>
                  <span className="font-headline-md text-headline-md text-primary-container whitespace-nowrap">
                    {formatCurrency(item.price)}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                  {item.description || "Món được chuẩn bị tươi mới tại nhà hàng."}
                </p>
              </div>

              {/* 4. Prep Time Row */}
              <div className="bg-primary-container/5 border-primary-container/10 mt-6 flex w-fit items-center gap-2 rounded-full border px-4 py-2">
                <Clock className="text-primary size-[18px]" />
                <span className="font-label-sm text-label-sm text-on-primary-fixed-variant">
                  Thời gian chuẩn bị: {item.preparationTime} phút
                </span>
              </div>
            </div>
          </section>

          {/* 5. Special Notes Card */}
          <section className="mt-6 px-4">
            <div className="bg-surface-container-lowest border-outline-variant/30 rounded-2xl border p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <StickyNote className="text-primary size-5" />
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Ghi chú cho món
                </h2>
              </div>
              <textarea
                className="bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-primary-container/30 min-h-[100px] w-full resize-none rounded-xl border-none p-4 transition-all outline-none focus:ring-2"
                placeholder="Ví dụ: Ít hành, không lấy giá..."
                {...register("note")}
              />
              <p className="font-label-sm text-label-sm text-on-surface-variant/70 mt-2 italic">
                Nhà hàng sẽ cố gắng đáp ứng yêu cầu của bạn.
              </p>
            </div>
          </section>
        </>
      ) : null}

      {/* 6. Fixed Bottom Footer */}
      {item ? (
        <footer className="bg-surface/80 fixed right-0 bottom-0 left-0 z-50 px-4 pt-4 pb-8 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] backdrop-blur-2xl">
          <div className="mx-auto flex max-w-[480px] items-center gap-4">
            {/* Quantity Stepper */}
            <div className="bg-primary-container/10 border-primary-container/10 flex h-14 items-center rounded-2xl border p-1">
              <button
                type="button"
                onClick={() => setValue("localQuantity", Math.max(1, localQuantity - 1))}
                className="hover:bg-primary-container/20 text-primary-container flex h-12 w-12 items-center justify-center rounded-xl transition-colors active:scale-90 disabled:opacity-50"
                disabled={isUpdating || localQuantity <= 1}
              >
                <Minus className="size-5" strokeWidth={2.5} />
              </button>
              <span className="font-headline-sm text-headline-sm text-on-primary-container w-10 text-center">
                {localQuantity}
              </span>
              <button
                type="button"
                onClick={() => setValue("localQuantity", localQuantity + 1)}
                className="hover:bg-primary-container/20 text-primary-container flex h-12 w-12 items-center justify-center rounded-xl transition-colors active:scale-90 disabled:opacity-50"
                disabled={isUpdating || !item.isAvailable}
              >
                <Plus className="size-5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Primary Action */}
            <button
              onClick={handleSaveToCart}
              disabled={isUpdating || !item.isAvailable}
              className="bg-primary-container text-on-primary-container font-headline-sm text-headline-sm active-scale disabled:bg-surface-variant disabled:text-on-surface-variant flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl shadow-md transition-all hover:brightness-110 disabled:shadow-none"
            >
              <ShoppingBag className="size-5" />
              {quantity > 0 && localQuantity === quantity ? "Cập nhật ghi chú" : "Thêm vào giỏ"}
            </button>
          </div>
        </footer>
      ) : null}
    </main>
  );
};

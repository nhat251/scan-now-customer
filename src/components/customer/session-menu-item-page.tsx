"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ChevronLeft, Clock, Loader2, Minus, Plus, ShoppingBag, StickyNote, Utensils } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { usePublicMenuItemQuery } from "@/hooks/queries/usePublicCustomerQueries";
import { recalculateCart, useSharedCart } from "@/hooks/useSharedCart";
import { showNotify } from "@/stores/global";
import type { CartItemDto } from "@/types/cart";
import type { PersistedCustomerSession } from "@/types/customer-session";
import { cn } from "@/lib/utils";

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
  
  // Local quantity for the UI so user can tweak before saving, 
  // or maybe use `quantity` directly if we want immediate cart sync.
  // The original design uses immediate sync for "setCartQuantity" or maybe just local? 
  // Original implementation updates cart only on handleSaveToCart. Wait!
  // Looking at the original: `const [note, setNote] = useState("");`
  // And `const setCartQuantity = async (nextQuantity: number) => { ... updateCart ... }`
  // `handleSaveToCart = async () => { await setCartQuantity(quantity || 1); ... }`
  // Wait, if it uses `quantity`, it's directly from `cartLine?.quantity`. 
  // Let's create a local state for quantity to mimic the design "Thêm vào giỏ", or just update cart immediately.
  // Original `handleSaveToCart` used `quantity || 1`. 
  // But wait, in the bottom bar it has minus, plus, and then a button "Thêm vào giỏ".
  // Let's use local quantity state.
  const [localQuantity, setLocalQuantity] = useState(Math.max(quantity, 1));

  useEffect(() => {
    setNote(cartLine?.specialRequest ?? "");
    setLocalQuantity(Math.max(cartLine?.quantity ?? 1, 1));
  }, [cartLine]);

  const handleSaveToCart = async () => {
    if (!item) return;

    const nextItems = cart.items.filter((line) => line.menuItemId !== item.menuItemId);

    if (localQuantity > 0) {
      const nextLine: CartItemDto = {
        menuItemId: item.menuItemId,
        menuItemName: item.name,
        price: item.price,
        quantity: localQuantity,
        specialRequest: note.trim() || null,
        imageUrl: item.imageUrl || null,
      };
      nextItems.push(nextLine);
    }

    await updateCart(recalculateCart({ items: nextItems, totalAmount: 0 }));
    
    showNotify({
      type: "success",
      message: localQuantity > 0 ? "Đã cập nhật món trong giỏ hàng." : "Đã thêm món vào giỏ hàng.",
    });
  };

  return (
    <main className="bg-background text-on-surface font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed pb-32 max-w-[480px] mx-auto min-h-screen">
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
          <span className="font-label-md text-label-md text-on-primary-container">{session ? `Bàn ${session.tableNumber}` : "Bàn"}</span>
        </div>
      </header>

      {/* Loading state */}
      {!sessionLoaded || itemQuery.isLoading ? (
        <div className="flex min-h-72 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : null}

      {/* Session not found */}
      {sessionLoaded && !session ? (
        <section className="mx-4 mt-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto size-10 text-error" />
          <h1 className="mt-3 text-xl font-bold">Phiên đặt món không còn khả dụng</h1>
          <p className="mt-2 text-sm text-on-surface-variant">Vui lòng quay lại menu từ mã QR của bàn.</p>
        </section>
      ) : null}

      {/* Error state */}
      {itemQuery.isError ? (
        <section className="mx-4 mt-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto size-10 text-error" />
          <h1 className="mt-3 text-xl font-bold">Không thể tải món ăn</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            {getCustomerApiErrorMessage(itemQuery.error, "Món ăn không tồn tại hoặc không còn phục vụ.")}
          </p>
          <Button className="mt-5 bg-primary text-white" onClick={() => itemQuery.refetch()} disabled={itemQuery.isRefetching}>
            Thử lại
          </Button>
        </section>
      ) : null}

      {/* Item content */}
      {item ? (
        <>
          {/* 2. Food Hero Image */}
          <section className="relative w-full h-[280px] overflow-hidden">
            <Image
              src={item.imageUrl || FALLBACK_IMAGE}
              alt={item.name}
              fill
              unoptimized
              sizes="480px"
              className={cn("object-cover transition-transform duration-300", !item.isAvailable && "opacity-60 grayscale")}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            {/* Badge */}
            {item.isFeatured ? (
              <div className="absolute top-4 left-4 bg-primary text-on-primary px-3 py-1 rounded-lg font-label-md text-label-md shadow-lg">
                NỔI BẬT
              </div>
            ) : null}
            {!item.isAvailable ? (
              <div className="absolute top-4 right-4 bg-surface-container-highest text-on-surface px-3 py-1 rounded-lg font-label-md text-label-md shadow-lg opacity-90">
                HẾT HÀNG
              </div>
            ) : null}
          </section>

          {/* 3. Sliding Info Card */}
          <section className="relative px-4 -mt-6">
            <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-lg border border-outline-variant/10">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">{item.categoryName ?? "Món ăn"}</span>
                <div className="flex justify-between items-start gap-4">
                  <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface leading-tight">{item.name}</h1>
                  <span className="font-headline-md text-headline-md text-primary-container whitespace-nowrap">{formatCurrency(item.price)}</span>
                </div>
                <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  {item.description || "Món được chuẩn bị tươi mới tại nhà hàng."}
                </p>
              </div>

              {/* 4. Prep Time Row */}
              <div className="mt-6 flex items-center gap-2 bg-primary-container/5 w-fit px-4 py-2 rounded-full border border-primary-container/10">
                <Clock className="text-primary size-[18px]" />
                <span className="font-label-sm text-label-sm text-on-primary-fixed-variant">Thời gian chuẩn bị: {item.preparationTime} phút</span>
              </div>
            </div>
          </section>

          {/* 5. Special Notes Card */}
          <section className="px-4 mt-6">
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30">
              <div className="flex items-center gap-2 mb-4">
                <StickyNote className="text-primary size-5" />
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Ghi chú cho món</h2>
              </div>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl p-4 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary-container/30 transition-all min-h-[100px] resize-none outline-none"
                placeholder="Ví dụ: Ít hành, không lấy giá..."
              />
              <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant/70 italic">
                Nhà hàng sẽ cố gắng đáp ứng yêu cầu của bạn.
              </p>
            </div>
          </section>
        </>
      ) : null}

      {/* 6. Fixed Bottom Footer */}
      {item ? (
        <footer className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-2xl px-4 pt-4 pb-8 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] z-50">
          <div className="flex items-center gap-4 max-w-[480px] mx-auto">
            {/* Quantity Stepper */}
            <div className="flex items-center bg-primary-container/10 rounded-2xl p-1 h-14 border border-primary-container/10">
              <button
                type="button"
                onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))}
                className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-primary-container/20 transition-colors active:scale-90 text-primary-container disabled:opacity-50"
                disabled={isUpdating || localQuantity <= 1}
              >
                <Minus className="size-5" strokeWidth={2.5} />
              </button>
              <span className="w-10 text-center font-headline-sm text-headline-sm text-on-primary-container">{localQuantity}</span>
              <button
                type="button"
                onClick={() => setLocalQuantity(localQuantity + 1)}
                className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-primary-container/20 transition-colors active:scale-90 text-primary-container disabled:opacity-50"
                disabled={isUpdating || !item.isAvailable}
              >
                <Plus className="size-5" strokeWidth={2.5} />
              </button>
            </div>
            
            {/* Primary Action */}
            <button
              onClick={handleSaveToCart}
              disabled={isUpdating || !item.isAvailable}
              className="flex-1 bg-primary-container text-on-primary-container h-14 rounded-2xl flex items-center justify-center gap-2 font-headline-sm text-headline-sm shadow-md hover:brightness-110 active-scale transition-all disabled:bg-surface-variant disabled:text-on-surface-variant disabled:shadow-none"
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

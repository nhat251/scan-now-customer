"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpDown,
  Check,
  ClipboardList,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  Utensils,
  X,
} from "lucide-react";

import { SessionCartSheet } from "@/components/customer/session-cart-sheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PATH } from "@/constants/path";
import {
  usePublicBranchCategoriesQuery,
  usePublicSessionMenuQuery,
} from "@/hooks/queries/usePublicCustomerQueries";
import { recalculateCart, useSharedCart } from "@/hooks/useSharedCart";
import { cn } from "@/lib/utils";
import type { CartItemDto } from "@/types/cart";
import type {
  PersistedCustomerSession,
  PublicCategoryResponse,
  PublicMenuCategoryResponse,
  PublicMenuItemResponse,
  SessionMenuQuery,
  SessionMenuResponse,
} from "@/types/customer-session";
import type { UseQueryResult } from "@tanstack/react-query";

import {
  formatCurrency,
  getCustomerApiErrorMessage,
  persistCustomerSession,
  readPersistedCustomerOrder,
  readPersistedCustomerSession,
} from "./customer-session-utils";

type Props = {
  sessionCode: string;
};

type CategoryOption = {
  id: string;
  name: string;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";

const SORT_OPTIONS = [
  { label: "Đề xuất", value: "displayOrder:asc" },
  { label: "Giá tăng dần", value: "price:asc" },
  { label: "Giá giảm dần", value: "price:desc" },
  { label: "Tên A-Z", value: "name:asc" },
];

export const SessionMenuPage = ({ sessionCode }: Props) => {
  const router = useRouter();
  const normalizedSessionCode = sessionCode.toUpperCase();
  const [categoryId, setCategoryId] = useState("all");
  const [sortValue, setSortValue] = useState(SORT_OPTIONS[0]?.value ?? "displayOrder:asc");
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [persistedSession, setPersistedSession] = useState<PersistedCustomerSession | null>(null);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const {
    cart,
    isUpdating: isCartUpdating,
    updateCart,
    clearCart,
  } = useSharedCart(normalizedSessionCode);

  useEffect(() => {
    setPersistedSession(readPersistedCustomerSession());
    setTrackedOrderId(readPersistedCustomerOrder(normalizedSessionCode));
  }, [normalizedSessionCode]);

  const [sortBy, sortDirection] = sortValue.split(":") as [string, "asc" | "desc"];
  const menuQuery = useMemo<SessionMenuQuery>(
    () => ({
      pageNumber: 1,
      pageSize: 100,
      categoryId: categoryId === "all" ? undefined : categoryId,
      sortBy,
      sortDirection,
    }),
    [categoryId, sortBy, sortDirection]
  );

  const sessionMenuQuery: UseQueryResult<SessionMenuResponse, Error> = usePublicSessionMenuQuery(
    normalizedSessionCode,
    menuQuery
  );
  const session = sessionMenuQuery.data?.session ?? persistedSession;
  const categoriesQuery: UseQueryResult<PublicCategoryResponse[], Error> =
    usePublicBranchCategoriesQuery(session?.branchId);
  const menuGroups = useMemo<PublicMenuCategoryResponse[]>(
    () => sessionMenuQuery.data?.menu.items ?? [],
    [sessionMenuQuery.data?.menu.items]
  );

  useEffect(() => {
    if (sessionMenuQuery.data?.session) {
      persistCustomerSession(normalizedSessionCode, sessionMenuQuery.data.session);
      setPersistedSession(readPersistedCustomerSession());
    }
  }, [normalizedSessionCode, sessionMenuQuery.data?.session]);

  const categories = useMemo<CategoryOption[]>(() => {
    if (categoriesQuery.data?.length) {
      return categoriesQuery.data
        .filter((category) => category.isActive)
        .sort((left, right) => left.displayOrder - right.displayOrder)
        .map((category) => ({
          id: category.categoryId,
          name: category.name,
        }));
    }

    return menuGroups.map((group) => ({
      id: group.categoryId,
      name: group.categoryName,
    }));
  }, [categoriesQuery.data, menuGroups]);

  const cartLines = cart.items;
  const totalItems = cartLines.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cart.totalAmount;
  const menuItems = menuGroups.flatMap((group) => group.items);
  const mustTryItems = [...menuItems]
    .sort(
      (left, right) =>
        Number(right.isFeatured) - Number(left.isFeatured) || left.displayOrder - right.displayOrder
    )
    .slice(0, 6);

  const updateQuantity = async (item: PublicMenuItemResponse, delta: number) => {
    const currentLine = cart.items.find((line) => line.menuItemId === item.menuItemId);
    const currentQuantity = currentLine?.quantity ?? 0;
    const nextQuantity = Math.max(currentQuantity + delta, 0);
    const nextItems = cart.items.filter((line) => line.menuItemId !== item.menuItemId);

    if (nextQuantity > 0) {
      const cartItem: CartItemDto = {
        menuItemId: item.menuItemId,
        menuItemName: item.name,
        price: item.price,
        quantity: nextQuantity,
        specialRequest: currentLine?.specialRequest ?? null,
        imageUrl: item.imageUrl || null,
      };

      nextItems.push(cartItem);
    }

    await updateCart(recalculateCart({ items: nextItems, totalAmount: 0 }));
  };

  const updateCartQuantity = async (item: CartItemDto, delta: number) => {
    const nextQuantity = Math.max(item.quantity + delta, 0);
    const nextItems = cart.items.filter((line) => line.menuItemId !== item.menuItemId);

    if (nextQuantity > 0) {
      nextItems.push({ ...item, quantity: nextQuantity });
    }

    await updateCart(recalculateCart({ items: nextItems, totalAmount: 0 }));
  };

  const updateCartNote = async (menuItemId: string, specialRequest: string) => {
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

  return (
    <main className="bg-background font-body-md text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed relative mx-auto min-h-screen max-w-[480px] pb-32">
      {/* 1. Sticky Header */}
      <header className="bg-surface/95 sticky top-0 z-50 flex h-16 w-full items-center justify-between px-4 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Utensils className="text-primary size-6" />
          <h1 className="font-headline-md text-headline-md text-primary font-bold">ScanNow</h1>
        </div>
        <div className="bg-primary-container flex items-center gap-2 rounded-full px-4 py-1.5">
          <Utensils className="text-on-primary-container size-4" />
          <span className="font-label-md text-on-primary-container">
            {session ? `Bàn ${session.tableNumber}` : "Bàn"}
          </span>
        </div>
      </header>

      {/* 2. Orange Welcome Banner */}
      <section className="px-4 pt-6">
        <div className="shadow-primary/20 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#f97316] to-[#d84315] p-6 text-white shadow-lg">
          <div className="relative z-10">
            <p className="font-label-sm mb-1 tracking-wider text-white uppercase opacity-90">
              Chào mừng bạn đến với
            </p>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile mb-2 font-extrabold text-white">
              {session?.branchName || "ScanNow Cao cấp"}
            </h2>
            <p className="font-body-sm max-w-[80%] text-white opacity-90">
              Thưởng thức hương vị truyền thống trong không gian hiện đại.
            </p>
          </div>
          {/* Abstract Shape Decoration */}
          <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute top-2 -right-4 h-20 w-20 rounded-full border-4 border-white/10"></div>
        </div>
      </section>

      {/* 3. Featured Dishes Row */}
      {!sessionMenuQuery.isLoading && !sessionMenuQuery.isError && mustTryItems.length > 0 ? (
        <section className="pt-8">
          <div className="mb-4 flex items-end justify-between px-4">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Gợi ý dành cho bạn
            </h3>
            <Sparkles className="text-primary size-5" />
          </div>
          <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-2">
            {mustTryItems.map((item) => (
              <Link
                key={item.menuItemId}
                href={PATH.customer.sessionMenuItem(normalizedSessionCode, item.menuItemId)}
                className="bg-surface-container-lowest active-scale block w-[160px] flex-shrink-0 rounded-2xl p-2 shadow-sm transition-transform duration-150"
              >
                <div className="bg-surface-variant relative mb-3 h-24 w-full overflow-hidden rounded-lg">
                  <Image
                    src={item.imageUrl || FALLBACK_IMAGE}
                    alt={item.name}
                    fill
                    sizes="160px"
                    unoptimized
                    className="object-cover"
                  />
                  {item.isFeatured ? (
                    <span className="bg-secondary absolute top-1 right-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
                      Bán chạy
                    </span>
                  ) : null}
                </div>
                <h4 className="font-body-sm text-on-surface truncate font-bold">{item.name}</h4>
                <p className="font-body-md text-primary font-bold">{formatCurrency(item.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* 4. Category + Sort Controls */}
      <section className="flex gap-3 px-4 pt-8">
        <button
          type="button"
          onClick={() => setCategorySheetOpen(true)}
          className="border-outline-variant font-headline-sm text-on-surface-variant active-scale hover:bg-surface-container-low relative flex flex-1 items-center justify-center gap-2 rounded-xl border bg-white py-3 transition-all"
        >
          <Store className="size-5" />
          <span className="text-label-md max-w-[100px] truncate">
            {categoryId === "all"
              ? "Danh mục"
              : categories.find((c) => c.id === categoryId)?.name || "Danh mục"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSortSheetOpen(true)}
          className="border-outline-variant font-headline-sm text-on-surface-variant active-scale hover:bg-surface-container-low relative flex flex-1 items-center justify-center gap-2 rounded-xl border bg-white py-3 transition-all"
        >
          <ArrowUpDown className="size-5" />
          <span className="text-label-md max-w-[100px] truncate">
            {SORT_OPTIONS.find((s) => s.value === sortValue)?.label || "Sắp xếp"}
          </span>
        </button>
      </section>

      {/* 5. Menu Items List */}
      <section className="flex flex-col gap-4 px-4 pt-6">
        {sessionMenuQuery.isLoading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Loader2 className="text-primary size-8 animate-spin" />
          </div>
        ) : null}

        {sessionMenuQuery.isError ? (
          <div className="border-outline-variant/50 rounded-2xl border bg-white p-8 text-center shadow-sm">
            <AlertCircle className="text-error mx-auto size-10" />
            <h2 className="mt-3 text-xl font-bold">Không thể tải thực đơn</h2>
            <p className="text-on-surface-variant mt-2 text-sm">
              {getCustomerApiErrorMessage(
                sessionMenuQuery.error,
                "Phiên dùng bữa không tồn tại hoặc đã hết hạn."
              )}
            </p>
            <Button
              className="bg-primary mt-5 text-white"
              onClick={() => sessionMenuQuery.refetch()}
              disabled={sessionMenuQuery.isRefetching}
            >
              Thử lại
            </Button>
          </div>
        ) : null}

        {!sessionMenuQuery.isLoading && !sessionMenuQuery.isError && menuGroups.length === 0 ? (
          <div className="border-outline-variant/50 rounded-2xl border bg-white p-8 text-center shadow-sm">
            <ShoppingBag className="text-on-surface-variant/50 mx-auto size-10" />
            <h2 className="text-on-surface mt-3 text-xl font-bold">Chưa có món phù hợp</h2>
            <p className="text-on-surface-variant mt-2 text-sm">
              Hãy thử danh mục hoặc cách sắp xếp khác.
            </p>
          </div>
        ) : null}

        {menuItems.map((item) => {
          const quantity =
            cart.items.find((line) => line.menuItemId === item.menuItemId)?.quantity ?? 0;

          return (
            <div
              key={item.menuItemId}
              className="active:bg-surface-container border-outline-variant/30 flex gap-4 rounded-2xl border bg-white p-3 shadow-sm transition-colors"
            >
              <Link
                href={PATH.customer.sessionMenuItem(normalizedSessionCode, item.menuItemId)}
                className="bg-surface-variant relative block h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl"
              >
                <Image
                  src={item.imageUrl || FALLBACK_IMAGE}
                  alt={item.name}
                  fill
                  sizes="96px"
                  unoptimized
                  className={cn("object-cover", !item.isAvailable && "opacity-50 grayscale")}
                />
                {item.isFeatured ? (
                  <span className="bg-secondary absolute top-1 right-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
                    Bán chạy
                  </span>
                ) : null}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                <Link
                  href={PATH.customer.sessionMenuItem(normalizedSessionCode, item.menuItemId)}
                  className="block"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-headline-sm text-on-surface line-clamp-1 text-base">
                      {item.name}
                    </h4>
                    {!item.isAvailable ? (
                      <span className="bg-surface-variant text-on-surface-variant ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold">
                        Hết món
                      </span>
                    ) : null}
                  </div>
                  <p className="font-body-sm text-on-surface-variant mt-1 line-clamp-2 leading-tight">
                    {item.description || "Món được chuẩn bị tươi mới."}
                  </p>
                </Link>

                <div className="mt-2 flex items-center justify-between">
                  <p className="font-headline-sm text-primary">{formatCurrency(item.price)}</p>

                  {quantity > 0 ? (
                    <div className="border-primary/20 bg-surface flex items-center gap-2 rounded-full border px-1 py-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item, -1)}
                        className="border-primary/30 text-primary hover:bg-surface-container flex size-7 items-center justify-center rounded-full border bg-white shadow-sm transition-all active:scale-90"
                        aria-label={`Giảm số lượng ${item.name}`}
                      >
                        <Minus className="size-3.5" strokeWidth={2.5} />
                      </button>
                      <span className="font-label-md text-on-surface min-w-4 text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item, 1)}
                        className="bg-primary hover:bg-primary/90 flex size-7 items-center justify-center rounded-full text-white shadow-sm transition-all active:scale-90"
                        aria-label={`Tăng số lượng ${item.name}`}
                      >
                        <Plus className="size-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!item.isAvailable}
                      onClick={() => updateQuantity(item, 1)}
                      className="bg-primary disabled:bg-surface-variant disabled:text-on-surface-variant flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform active:scale-90"
                    >
                      <Plus className="size-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* 6. Fixed Bottom Cart Bar */}
      <div className="bg-surface/80 border-outline-variant/30 fixed bottom-0 left-0 z-50 w-full border-t px-4 pt-4 pb-8 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[480px] items-center justify-between">
          <div className="flex flex-col">
            <div className="mb-0.5 flex items-center gap-1.5">
              <span className="font-label-sm text-on-surface-variant">Giỏ hàng:</span>
              <span className="font-label-md text-primary bg-primary-container/20 rounded-full px-2 py-0.5">
                {totalItems} món
              </span>
            </div>
            <p className="font-headline-sm text-primary text-xl">{formatCurrency(subtotal)}</p>
          </div>

          <div className="flex items-center gap-2">
            {trackedOrderId && totalItems > 0 ? (
              <button
                onClick={() =>
                  router.push(PATH.customer.sessionOrder(normalizedSessionCode, trackedOrderId))
                }
                className="bg-secondary shadow-secondary/20 active-scale flex size-[52px] shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-all"
                aria-label="Theo dõi đơn"
              >
                <ClipboardList className="size-6" />
              </button>
            ) : null}
            <button
              disabled={totalItems > 0 ? isCartUpdating : !trackedOrderId}
              onClick={() =>
                totalItems > 0
                  ? setCartOpen(true)
                  : router.push(
                      PATH.customer.sessionOrder(normalizedSessionCode, trackedOrderId ?? "")
                    )
              }
              className="bg-primary shadow-primary/25 active-scale flex h-[52px] items-center gap-3 rounded-2xl px-6 text-white shadow-lg transition-all disabled:opacity-50 disabled:shadow-none"
            >
              <span className="font-headline-sm text-base">
                {totalItems > 0 ? "Xem giỏ hàng" : trackedOrderId ? "Theo dõi đơn" : "Giỏ hàng"}
              </span>
              <ArrowRight className="size-5" />
            </button>
          </div>
        </div>
      </div>

      <SessionCartSheet
        cart={cart}
        sessionCode={normalizedSessionCode}
        open={cartOpen}
        isUpdating={isCartUpdating}
        onOpenChange={setCartOpen}
        onQuantityChange={updateCartQuantity}
        onNoteChange={updateCartNote}
        onClear={clearCart}
      />

      {/* Category Bottom Sheet */}
      <Dialog open={categorySheetOpen} onOpenChange={setCategorySheetOpen}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="z-[80] bg-black/40 backdrop-blur-sm"
          className="data-[state=open]:slide-in-from-bottom-10 data-[state=closed]:slide-out-to-bottom-10 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 bg-surface-container-lowest top-auto bottom-0 left-1/2 z-[90] flex max-h-[800px] max-w-[480px] -translate-x-1/2 translate-y-0 flex-col gap-0 rounded-t-[2rem] rounded-b-none border-0 p-0 shadow-2xl duration-300"
        >
          <div className="bg-outline-variant/50 mx-auto mt-3 h-1.5 w-12 rounded-full" />
          <DialogHeader className="border-outline-variant/30 flex-row items-center justify-between gap-3 border-b px-5 pt-4 pb-4 text-left">
            <DialogTitle className="font-headline-sm text-headline-sm text-on-surface">
              Danh mục
            </DialogTitle>
            <DialogClose asChild>
              <button
                aria-label="Đóng"
                className="bg-surface-variant text-on-surface hover:bg-outline-variant/50 flex h-10 w-10 items-center justify-center rounded-full transition-colors"
              >
                <X className="size-5" />
              </button>
            </DialogClose>
          </DialogHeader>
          <div className="pb-safe flex flex-col gap-2 overflow-y-auto p-4">
            <button
              onClick={() => {
                setCategoryId("all");
                setCategorySheetOpen(false);
              }}
              className={cn(
                "active-scale flex items-center justify-between rounded-2xl px-4 py-3.5 transition-colors",
                categoryId === "all"
                  ? "bg-primary-container/10 text-primary-container font-bold"
                  : "text-on-surface border-outline-variant/30 border bg-white shadow-sm"
              )}
            >
              <span className="font-headline-sm text-base">Tất cả món</span>
              {categoryId === "all" && <Check className="size-5" strokeWidth={2.5} />}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setCategoryId(category.id);
                  setCategorySheetOpen(false);
                }}
                className={cn(
                  "active-scale flex items-center justify-between rounded-2xl px-4 py-3.5 transition-colors",
                  categoryId === category.id
                    ? "bg-primary-container/10 text-primary-container font-bold"
                    : "text-on-surface border-outline-variant/30 border bg-white shadow-sm"
                )}
              >
                <span className="font-headline-sm text-base">{category.name}</span>
                {categoryId === category.id && <Check className="size-5" strokeWidth={2.5} />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sort Bottom Sheet */}
      <Dialog open={sortSheetOpen} onOpenChange={setSortSheetOpen}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="z-[80] bg-black/40 backdrop-blur-sm"
          className="data-[state=open]:slide-in-from-bottom-10 data-[state=closed]:slide-out-to-bottom-10 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 bg-surface-container-lowest top-auto bottom-0 left-1/2 z-[90] flex max-h-[800px] max-w-[480px] -translate-x-1/2 translate-y-0 flex-col gap-0 rounded-t-[2rem] rounded-b-none border-0 p-0 shadow-2xl duration-300"
        >
          <div className="bg-outline-variant/50 mx-auto mt-3 h-1.5 w-12 rounded-full" />
          <DialogHeader className="border-outline-variant/30 flex-row items-center justify-between gap-3 border-b px-5 pt-4 pb-4 text-left">
            <DialogTitle className="font-headline-sm text-headline-sm text-on-surface">
              Sắp xếp theo
            </DialogTitle>
            <DialogClose asChild>
              <button
                aria-label="Đóng"
                className="bg-surface-variant text-on-surface hover:bg-outline-variant/50 flex h-10 w-10 items-center justify-center rounded-full transition-colors"
              >
                <X className="size-5" />
              </button>
            </DialogClose>
          </DialogHeader>
          <div className="pb-safe flex flex-col gap-2 overflow-y-auto p-4">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSortValue(option.value);
                  setSortSheetOpen(false);
                }}
                className={cn(
                  "active-scale flex items-center justify-between rounded-2xl px-4 py-3.5 transition-colors",
                  sortValue === option.value
                    ? "bg-primary-container/10 text-primary-container font-bold"
                    : "text-on-surface border-outline-variant/30 border bg-white shadow-sm"
                )}
              >
                <span className="font-headline-sm text-base">{option.label}</span>
                {sortValue === option.value && <Check className="size-5" strokeWidth={2.5} />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

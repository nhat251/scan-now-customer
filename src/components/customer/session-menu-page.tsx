"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowUpDown, Loader2, Minus, Plus, ShoppingBag, Sparkles, Store, Utensils } from "lucide-react";

import { Logo } from "@/components/atoms/logo";
import { SessionCartSheet } from "@/components/customer/session-cart-sheet";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { usePublicBranchCategoriesQuery, usePublicSessionMenuQuery } from "@/hooks/queries/usePublicCustomerQueries";
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
  const [persistedSession, setPersistedSession] = useState<PersistedCustomerSession | null>(null);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const { cart, status: cartStatus, isUpdating: isCartUpdating, updateCart, clearCart } = useSharedCart(normalizedSessionCode);

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
  const categoriesQuery: UseQueryResult<PublicCategoryResponse[], Error> = usePublicBranchCategoriesQuery(
    session?.branchId
  );
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
    .sort((left, right) => Number(right.isFeatured) - Number(left.isFeatured) || left.displayOrder - right.displayOrder)
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
          item.menuItemId === menuItemId ? { ...item, specialRequest: specialRequest || null } : item
        ),
      })
    );
  };

  return (
    <main className="fixed inset-0 z-[60] overflow-y-auto bg-gradient-to-b from-orange-50/70 via-[#f8f9fa] to-[#f8f9fa] font-sans text-gray-900">
      <div className="mx-auto min-h-full w-full max-w-md pb-24">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-orange-50 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md">
          <Logo size={16} textSize="text-xl" />
          <div className="text-primary-container flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-sm font-bold">
            <Utensils className="size-4" />
            {session ? `Bàn ${session.tableNumber}` : "Bàn"}
          </div>
        </header>

        {session ? (
          <section className="px-4 pt-4">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white shadow-lg shadow-orange-200/70">
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-orange-100 uppercase">
                <Sparkles className="size-4" />
                Thực đơn tại bàn {session.tableNumber}
              </p>
              <h1 className="mt-2 text-2xl font-black">{session.branchName}</h1>
              <p className="mt-2 max-w-xs text-sm leading-5 text-orange-50">
                Chọn món yêu thích, thêm ghi chú theo khẩu vị và gửi đơn ngay tại bàn.
              </p>
            </div>
          </section>
        ) : null}

        {!sessionMenuQuery.isLoading && !sessionMenuQuery.isError && mustTryItems.length > 0 ? (
          <section className="mt-5 px-4">
            <h2 className="mb-3 text-lg font-bold text-gray-800">Gợi ý dành cho bạn</h2>
            <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
              {mustTryItems.map((item) => (
                <Link
                  key={item.menuItemId}
                  href={PATH.customer.sessionMenuItem(normalizedSessionCode, item.menuItemId)}
                  className="w-[160px] shrink-0 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  <div className="relative mb-2 h-24 w-full overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      alt={item.name}
                      src={item.imageUrl || FALLBACK_IMAGE}
                      fill
                      sizes="160px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <h3 className="truncate text-sm font-bold text-gray-900">{item.name}</h3>
                  <span className="text-primary-container text-sm font-bold">{formatCurrency(item.price)}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6 px-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-gray-800">Khám phá món ngon</h2>
              {session ? (
                <p className="truncate text-xs font-semibold text-gray-500">
                  Mã phiên: {normalizedSessionCode}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <label className="relative flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                <Store className="size-[18px]" />
                <span>Danh mục</span>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Danh mục"
                >
                  <option value="all">Tất cả</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="relative flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                <ArrowUpDown className="size-[18px]" />
                <span>Sắp xếp</span>
                <select
                  value={sortValue}
                  onChange={(event) => setSortValue(event.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Sắp xếp"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {sessionMenuQuery.isLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="text-primary-container size-8 animate-spin" />
            </div>
          ) : null}

          {sessionMenuQuery.isError ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <AlertCircle className="text-destructive mx-auto size-10" />
              <h2 className="mt-3 text-xl font-bold">Không thể tải thực đơn</h2>
              <p className="mt-2 text-sm text-gray-500">
                {getCustomerApiErrorMessage(sessionMenuQuery.error, "Phiên dùng bữa không tồn tại hoặc đã hết hạn.")}
              </p>
              <Button className="mt-5" onClick={() => sessionMenuQuery.refetch()} disabled={sessionMenuQuery.isRefetching}>
                Thử lại
              </Button>
            </div>
          ) : null}

          {!sessionMenuQuery.isLoading && !sessionMenuQuery.isError && menuGroups.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <ShoppingBag className="mx-auto size-10 text-gray-400" />
              <h2 className="mt-3 text-xl font-bold">Chưa có món phù hợp</h2>
              <p className="mt-2 text-sm text-gray-500">Hãy thử danh mục hoặc cách sắp xếp khác.</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-4">
            {menuItems.map((item) => {
              const quantity = cart.items.find((line) => line.menuItemId === item.menuItemId)?.quantity ?? 0;

              return (
                <article key={item.menuItemId} className="flex gap-4 rounded-2xl border border-gray-50 bg-white p-3 shadow-sm">
                  <Link
                    href={PATH.customer.sessionMenuItem(normalizedSessionCode, item.menuItemId)}
                    className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-gray-100"
                  >
                    <Image
                      alt={item.name}
                      src={item.imageUrl || FALLBACK_IMAGE}
                      fill
                      sizes="96px"
                      unoptimized
                      className={cn("object-cover", !item.isAvailable && "opacity-50 grayscale")}
                    />
                    {item.isFeatured ? (
                      <span className="bg-primary-container absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-black text-white">
                        HOT
                      </span>
                    ) : null}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <Link href={PATH.customer.sessionMenuItem(normalizedSessionCode, item.menuItemId)} className="block">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 leading-tight font-bold text-gray-900">{item.name}</h3>
                        {!item.isAvailable ? (
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                            Hết món
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {item.description || "Món được chuẩn bị tươi mới tại nhà hàng."}
                      </p>
                    </Link>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-primary-container font-bold">{formatCurrency(item.price)}</span>
                      {quantity > 0 ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, -1)}
                            className="text-primary-container flex size-8 items-center justify-center rounded-full border border-orange-100 bg-orange-50 transition-colors hover:bg-orange-100"
                            aria-label={`Giảm số lượng ${item.name}`}
                          >
                            <Minus className="size-5" strokeWidth={2.5} />
                          </button>
                          <span className="min-w-3 text-center font-bold text-gray-900">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, 1)}
                            className="bg-primary-container hover:bg-primary flex size-8 items-center justify-center rounded-full text-white transition-colors"
                            aria-label={`Tăng số lượng ${item.name}`}
                          >
                            <Plus className="size-5" strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateQuantity(item, 1)}
                          disabled={!item.isAvailable}
                          className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                          aria-label={`Thêm ${item.name} vào giỏ`}
                        >
                          <Plus className="size-5" strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="fixed right-0 bottom-0 left-0 z-[70] border-t border-gray-100 bg-white/80 p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">Tổng</p>
            <p className="truncate font-bold text-gray-900">{totalItems} món</p>
            <p className="text-primary-container text-sm font-bold">{formatCurrency(subtotal)}</p>
            <p className="text-[11px] font-semibold text-gray-400">
              {cartStatus === "connected"
                ? "Giỏ dùng chung đã kết nối"
                : cartStatus === "reconnecting" || cartStatus === "connecting"
                  ? "Đang kết nối giỏ dùng chung"
                  : "Giỏ dùng chung đang ngoại tuyến"}
            </p>
          </div>
          <Button
            className="h-12 rounded-2xl px-6 text-base font-bold shadow-lg shadow-orange-200"
            disabled={totalItems > 0 ? isCartUpdating : !trackedOrderId}
            onClick={() =>
              totalItems > 0
                ? setCartOpen(true)
                : router.push(PATH.customer.sessionOrder(normalizedSessionCode, trackedOrderId ?? ""))
            }
          >
            <ShoppingBag className="size-5" />
            {totalItems > 0 ? "Xem giỏ" : trackedOrderId ? "Theo dõi đơn" : "Giỏ hàng"}
          </Button>
        </div>
      </footer>

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
    </main>
  );
};

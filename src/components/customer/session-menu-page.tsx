"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Store,
  Utensils,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublicBranchCategoriesQuery, usePublicSessionMenuQuery } from "@/hooks/queries/usePublicCustomerQueries";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
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
  readPersistedCustomerSession,
} from "./customer-session-utils";

type Props = {
  sessionCode: string;
};

type CartLine = {
  item: PublicMenuItemResponse;
  quantity: number;
};

type CategoryOption = {
  id: string;
  name: string;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";

const SORT_OPTIONS = [
  { label: "Recommended", value: "displayOrder:asc" },
  { label: "Price low to high", value: "price:asc" },
  { label: "Price high to low", value: "price:desc" },
  { label: "Name A-Z", value: "name:asc" },
];

export const SessionMenuPage = ({ sessionCode }: Props) => {
  const normalizedSessionCode = sessionCode.toUpperCase();
  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortValue, setSortValue] = useState(SORT_OPTIONS[0]?.value ?? "displayOrder:asc");
  const [persistedSession, setPersistedSession] = useState<PersistedCustomerSession | null>(null);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const search = useDebounce(searchInput.trim(), 250);

  useEffect(() => {
    setPersistedSession(readPersistedCustomerSession());
  }, []);

  const [sortBy, sortDirection] = sortValue.split(":") as [string, "asc" | "desc"];
  const menuQuery = useMemo<SessionMenuQuery>(
    () => ({
      pageNumber: 1,
      pageSize: 100,
      search: search || undefined,
      categoryId: categoryId === "all" ? undefined : categoryId,
      isFeatured: featuredOnly || undefined,
      sortBy,
      sortDirection,
    }),
    [categoryId, featuredOnly, search, sortBy, sortDirection]
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

  const cartLines = Object.values(cart);
  const totalItems = cartLines.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cartLines.reduce((total, line) => total + line.item.price * line.quantity, 0);

  const updateQuantity = (item: PublicMenuItemResponse, delta: number) => {
    setCart((currentCart) => {
      const currentQuantity = currentCart[item.menuItemId]?.quantity ?? 0;
      const nextQuantity = Math.max(currentQuantity + delta, 0);
      const nextCart = { ...currentCart };

      if (nextQuantity === 0) {
        delete nextCart[item.menuItemId];
        return nextCart;
      }

      nextCart[item.menuItemId] = {
        item,
        quantity: nextQuantity,
      };

      return nextCart;
    });
  };

  return (
    <main className="bg-background text-on-background fixed inset-0 z-[60] overflow-y-auto">
      <div className="mx-auto min-h-full w-full max-w-md pb-28">
        <header className="border-border/70 bg-card sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-primary-container text-on-primary flex size-9 items-center justify-center rounded-xl">
              <Utensils className="size-5" />
            </div>
            <span className="text-primary-container text-xl font-black tracking-tight">ScanNow</span>
          </div>
          <div className="border-primary-container/20 bg-primary-container/10 text-primary flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold">
            <Store className="size-4" />
            {session ? `Table ${session.tableNumber}` : "Table"}
          </div>
        </header>

        <section className="px-4 pt-4">
          <div className="bg-inverse-surface relative h-48 overflow-hidden rounded-2xl shadow-lg">
            <Image
              alt="Restaurant interior"
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"
              fill
              sizes="(max-width: 640px) 100vw, 448px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5">
              <h1 className="text-2xl font-bold text-white">{session?.branchName ?? "Loading menu"}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-white/85">
                <span>Table {session?.tableNumber ?? "--"}</span>
                <span className="text-white/45">/</span>
                <span>Session {normalizedSessionCode}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pt-5">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search menu"
              className="border-border bg-card h-12 rounded-full pl-12 shadow-sm"
            />
          </div>

          <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setCategoryId("all")}
              className={cn(
                "h-10 shrink-0 rounded-full border px-5 text-sm font-semibold shadow-sm",
                categoryId === "all"
                  ? "border-primary-container bg-primary-container text-on-primary shadow-primary-container/20"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(category.id)}
                className={cn(
                  "h-10 shrink-0 rounded-full border px-5 text-sm font-semibold shadow-sm",
                  categoryId === category.id
                    ? "border-primary-container bg-primary-container text-on-primary shadow-primary-container/20"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-[auto_1fr] gap-2">
            <button
              type="button"
              onClick={() => setFeaturedOnly((value) => !value)}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-bold shadow-sm",
                featuredOnly
                  ? "border-primary-container bg-primary-container text-on-primary"
                  : "border-border bg-card text-on-surface"
              )}
            >
              <Star className={cn("size-4", featuredOnly && "fill-current")} />
              Featured
            </button>
            <label className="relative">
              <SlidersHorizontal className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
              <select
                value={sortValue}
                onChange={(event) => setSortValue(event.target.value)}
                className="border-border bg-card focus:border-ring focus:ring-ring/50 h-11 w-full appearance-none rounded-full border pr-4 pl-11 text-sm font-bold shadow-sm outline-none focus:ring-3"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="px-4 pt-5">
          {sessionMenuQuery.isLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="text-primary-container size-8 animate-spin" />
            </div>
          ) : null}

          {sessionMenuQuery.isError ? (
            <div className="border-border bg-card rounded-2xl border p-8 text-center shadow-sm">
              <AlertCircle className="text-destructive mx-auto size-10" />
              <h2 className="mt-3 text-xl font-bold">Menu unavailable</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {getCustomerApiErrorMessage(sessionMenuQuery.error, "Session not found or expired")}
              </p>
              <Button className="mt-5" onClick={() => sessionMenuQuery.refetch()} disabled={sessionMenuQuery.isRefetching}>
                Try again
              </Button>
            </div>
          ) : null}

          {!sessionMenuQuery.isLoading && !sessionMenuQuery.isError && menuGroups.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-8 text-center shadow-sm">
              <ShoppingBag className="text-muted-foreground mx-auto size-10" />
              <h2 className="mt-3 text-xl font-bold">No menu items</h2>
              <p className="text-muted-foreground mt-2 text-sm">Try another search, category, or filter.</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-7">
            {menuGroups.map((group) => (
              <div key={group.categoryId}>
                <h2 className="text-on-surface mb-4 text-xl font-black tracking-tight">{group.categoryName}</h2>
                <div className="flex flex-col gap-4">
                  {group.items.map((item) => {
                    const quantity = cart[item.menuItemId]?.quantity ?? 0;

                    return (
                      <article
                        key={item.menuItemId}
                        className="border-border/60 bg-card flex gap-4 rounded-2xl border p-3 shadow-sm"
                      >
                        <div className="bg-surface-container relative size-24 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            alt={item.name}
                            src={item.imageUrl || FALLBACK_IMAGE}
                            fill
                            sizes="96px"
                            unoptimized
                            className={cn("object-cover", !item.isAvailable && "opacity-50 grayscale")}
                          />
                          {item.isFeatured ? (
                            <span className="bg-primary-container text-on-primary absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-black">
                              HOT
                            </span>
                          ) : null}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-on-surface line-clamp-2 leading-tight font-bold">{item.name}</h3>
                              {!item.isAvailable ? (
                                <span className="bg-surface-container text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold">
                                  Sold out
                                </span>
                              ) : null}
                            </div>
                            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                              {item.description || "Freshly prepared by the restaurant."}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="text-primary-container font-black">{formatCurrency(item.price)}</span>
                            {quantity > 0 ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item, -1)}
                                  className="bg-surface-container text-on-surface flex size-8 items-center justify-center rounded-full"
                                  aria-label={`Remove ${item.name}`}
                                >
                                  <Minus className="size-4" />
                                </button>
                                <span className="w-5 text-center text-sm font-black">{quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item, 1)}
                                  className="bg-primary-container text-on-primary flex size-8 items-center justify-center rounded-full"
                                  aria-label={`Add ${item.name}`}
                                >
                                  <Plus className="size-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => updateQuantity(item, 1)}
                                disabled={!item.isAvailable}
                                className="bg-primary-container text-on-primary shadow-primary-container/20 disabled:bg-surface-container disabled:text-muted-foreground flex size-8 items-center justify-center rounded-full shadow-md disabled:shadow-none"
                                aria-label={`Add ${item.name}`}
                              >
                                <Plus className="size-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="border-border/70 bg-card/90 fixed right-0 bottom-0 left-0 z-[70] border-t p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-black tracking-wider uppercase">Total Items</p>
            <p className="text-on-surface truncate text-lg font-black">
              {totalItems} {totalItems === 1 ? "item" : "items"} selected
            </p>
            <p className="text-primary-container text-sm font-bold">{formatCurrency(subtotal)}</p>
          </div>
          <Button className="h-14 rounded-2xl px-8 text-base" disabled={totalItems === 0}>
            <ShoppingBag className="size-5" />
            View Cart
          </Button>
        </div>
      </footer>
    </main>
  );
};

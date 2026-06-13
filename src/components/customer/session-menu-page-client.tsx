"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  AlertCircle,
  Search,
  ShoppingBag,
  Utensils,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import {
  calculateCartTotal,
  clearCart,
  readCart,
  toPlaceOrderItems,
  writeCart,
} from "@/lib/customer-cart";
import { Log } from "@/lib/log";
import { getTenantSlug } from "@/lib/tenant";
import { getSessionMenu, placeOrder } from "@/services/public-ordering";
import type { CartItem, MenuItemResponse, SessionMenuResponse } from "@/types/public-ordering";

import { MenuItemCard } from "./menu/menu-item-card";
import { PlaceOrderModal } from "./menu/place-order-modal";

export const SessionMenuPageClient = ({ sessionCode }: { sessionCode: string }) => {
  const router = useRouter();
  const tenantSlug = getTenantSlug();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SessionMenuResponse | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const res = await getSessionMenu(sessionCode);
        if (res.result) {
          setData(res.result);
          const storedCart = readCart(tenantSlug, sessionCode);
          setCart(storedCart);
        } else {
          setError("Không thể tải thông tin thực đơn.");
        }
      } catch (err: unknown) {
        Log.error({ prefix: "SessionMenu", message: "Fetch session menu error", data: err });
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Đã xảy ra lỗi khi tải thực đơn.");
        } else {
          setError("Đã xảy ra lỗi khi tải thực đơn.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [sessionCode, tenantSlug]);

  const updateCartItemQuantity = (item: MenuItemResponse, quantity: number) => {
    const newCart = [...cart];
    const existingIndex = newCart.findIndex((i) => i.menuItemId === item.menuItemId);

    if (quantity <= 0) {
      if (existingIndex > -1) {
        newCart.splice(existingIndex, 1);
      }
    } else {
      if (existingIndex > -1) {
        newCart[existingIndex].quantity = quantity;
      } else {
        newCart.push({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          quantity: quantity,
        });
      }
    }

    setCart(newCart);
    writeCart(tenantSlug, sessionCode, newCart);
  };

  const getCartItemQuantity = (menuItemId: string): number => {
    return cart.find((i) => i.menuItemId === menuItemId)?.quantity || 0;
  };

  const handlePlaceOrder = async (details: {
    customerName: string;
    customerPhone: string;
    customerNote: string;
  }) => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        customerName: details.customerName.trim() || undefined,
        customerPhone: details.customerPhone.trim() || undefined,
        customerNote: details.customerNote.trim() || undefined,
        items: toPlaceOrderItems(cart),
      };

      const res = await placeOrder(sessionCode, payload);
      if (res.result && res.result.orderId) {
        clearCart(tenantSlug, sessionCode);
        setCart([]);
        setIsSubmitModalOpen(false);
        router.push(PATH.customer.checkout(sessionCode, res.result.orderId));
      } else {
        setSubmitError("Đặt món thất bại. Vui lòng thử lại.");
      }
    } catch (err: unknown) {
      Log.error({ prefix: "SessionMenu", message: "Place order error", data: err });
      if (axios.isAxiosError(err)) {
        setSubmitError(err.response?.data?.message || "Đã xảy ra lỗi khi đặt món.");
      } else {
        setSubmitError("Đã xảy ra lỗi khi đặt món.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <Spinner className="h-10 w-10 text-indigo-500" />
        <p className="mt-4 text-sm text-slate-400">Đang tải thực đơn...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-100">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-500" />
          <h2 className="text-xl font-semibold text-white">Lỗi tải thực đơn</h2>
          <p className="mt-2 text-sm text-slate-400">
            {error || "Phiên đặt món không tồn tại hoặc đã hết hạn."}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-6 w-full bg-indigo-600 font-medium text-white hover:bg-indigo-500"
          >
            Tải lại trang
          </Button>
        </div>
      </div>
    );
  }

  const session = data.session;
  const categories = data.menu.items;

  const filteredCategories = categories
    .map((category) => {
      const filteredItems = category.items.filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
      });
      return { ...category, items: filteredItems };
    })
    .filter(
      (cat) => cat.items.length > 0 && (!activeCategoryId || cat.categoryId === activeCategoryId)
    );

  const totalCartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const totalCartAmount = calculateCartTotal(cart);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 pb-28 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/80 p-4 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">
              {session.branchName}
            </span>
            <h1 className="text-lg font-bold text-white">Bàn {session.tableNumber}</h1>
          </div>
          <div className="rounded-lg bg-indigo-500/10 px-3 py-1.5 text-center ring-1 ring-indigo-500/20">
            <span className="block text-[10px] text-indigo-300 uppercase">Mã bàn</span>
            <span className="font-mono text-sm font-bold text-white">{session.sessionCode}</span>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4">
        <div className="relative">
          <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm món ăn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pr-4 pl-10 text-sm text-white placeholder-slate-500 ring-indigo-500 transition outline-none focus:border-indigo-500 focus:ring-1"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute top-3.5 right-3 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="scrollbar-hide -mx-4 flex space-x-2 overflow-x-auto px-4 pb-1">
          <button
            onClick={() => setActiveCategoryId(null)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              activeCategoryId === null
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.categoryId}
              onClick={() => setActiveCategoryId(cat.categoryId)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                activeCategoryId === cat.categoryId
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {cat.categoryName}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 space-y-6 px-4">
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Utensils className="mb-3 h-12 w-12 stroke-1" />
            <p className="text-sm">Không tìm thấy món ăn nào phù hợp.</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.categoryId} className="space-y-3">
              <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase">
                {category.categoryName}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {category.items.map((item) => (
                  <MenuItemCard
                    key={item.menuItemId}
                    item={item}
                    quantity={getCartItemQuantity(item.menuItemId)}
                    onUpdateQuantity={updateCartItemQuantity}
                    formatVND={formatVND}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {totalCartCount > 0 && (
        <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-slate-800 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex max-w-md items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Tổng cộng ({totalCartCount} món)</p>
              <p className="text-lg font-bold text-indigo-400">{formatVND(totalCartAmount)}</p>
            </div>
            <Button
              onClick={() => {
                setSubmitError(null);
                setIsSubmitModalOpen(true);
              }}
              className="bg-indigo-600 px-6 font-semibold text-white shadow-lg shadow-indigo-900/20 hover:bg-indigo-500"
            >
              <ShoppingBag className="mr-2 h-4 w-4" /> Đặt món
            </Button>
          </div>
        </div>
      )}

      <PlaceOrderModal
        isOpen={isSubmitModalOpen}
        isSubmitting={isSubmitting}
        error={submitError}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handlePlaceOrder}
      />
    </div>
  );
};

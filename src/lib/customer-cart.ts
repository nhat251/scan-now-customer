import type { CartItem, PlaceOrderRequest } from "@/types/public-ordering";

export const getCartStorageKey = (tenantSlug: string | null, sessionCode: string): string => {
  return `cart:${tenantSlug || "unknown"}:${sessionCode}`;
};

export const readCart = (tenantSlug: string | null, sessionCode: string): CartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }
  const key = getCartStorageKey(tenantSlug, sessionCode);
  const data = window.localStorage.getItem(key);
  if (!data) {
    return [];
  }
  try {
    const items = JSON.parse(data) as CartItem[];
    if (!Array.isArray(items)) {
      window.localStorage.removeItem(key);
      return [];
    }
    // Clean and validate items
    const validItems = items
      .map((item) => ({
        ...item,
        quantity: Math.max(1, item.quantity || 1),
      }))
      .filter((item) => item.quantity > 0 && item.menuItemId);
    return validItems;
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
};

export const writeCart = (
  tenantSlug: string | null,
  sessionCode: string,
  items: CartItem[]
): void => {
  if (typeof window === "undefined") {
    return;
  }
  const key = getCartStorageKey(tenantSlug, sessionCode);
  const cleanItems = items
    .map((item) => ({
      ...item,
      quantity: item.quantity,
    }))
    .filter((item) => item.quantity > 0 && item.menuItemId);

  if (cleanItems.length === 0) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, JSON.stringify(cleanItems));
  }
};

export const clearCart = (tenantSlug: string | null, sessionCode: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  const key = getCartStorageKey(tenantSlug, sessionCode);
  window.localStorage.removeItem(key);
};

export const calculateCartTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

export const toPlaceOrderItems = (items: CartItem[]): PlaceOrderRequest["items"] => {
  return items.map((item) => ({
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    note: item.note || undefined,
  }));
};

import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import type { JoinSessionResponse, PersistedCustomerSession } from "@/types/customer-session";

const CUSTOMER_SESSION_KEY = "scan-now.customer-session";
const CUSTOMER_ORDER_KEY_PREFIX = "scan-now.customer-order";

export const getCustomerApiErrorMessage = (error: unknown, fallback: string) => {
  return getVietnameseApiErrorMessage(error, fallback);
};

export const persistCustomerSession = (sessionCode: string, session: JoinSessionResponse) => {
  const payload: PersistedCustomerSession = {
    sessionCode,
    sessionId: session.sessionId,
    branchId: session.branchId,
    tableId: session.tableId,
    tableNumber: session.tableNumber,
    branchName: session.branchName,
    expiresAt: session.expiresAt,
  };

  window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(payload));
};

export const readPersistedCustomerSession = () => {
  const raw = window.localStorage.getItem(CUSTOMER_SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedCustomerSession;
  } catch {
    window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
    return null;
  }
};

export const persistCustomerOrder = (sessionCode: string, orderId: string) => {
  const key = `${CUSTOMER_ORDER_KEY_PREFIX}.${sessionCode.toUpperCase()}`;
  const existing = readPersistedCustomerOrders(sessionCode);
  if (!existing.includes(orderId)) {
    existing.push(orderId);
  }
  window.localStorage.setItem(key, JSON.stringify(existing));
};

export const readPersistedCustomerOrders = (sessionCode: string): string[] => {
  const raw = window.localStorage.getItem(
    `${CUSTOMER_ORDER_KEY_PREFIX}.${sessionCode.toUpperCase()}`
  );
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    // Backward-compat: if old format was a plain string, wrap it
    if (typeof parsed === "string") return [parsed];
    if (Array.isArray(parsed)) return parsed as string[];
    return [];
  } catch {
    return [];
  }
};

/** Returns the most recently added orderId (backward compat). */
export const readPersistedCustomerOrder = (sessionCode: string): string | null => {
  const orders = readPersistedCustomerOrders(sessionCode);
  return orders.length > 0 ? (orders[orders.length - 1] ?? null) : null;
};

export const clearPersistedCustomerOrder = (sessionCode: string) => {
  window.localStorage.removeItem(`${CUSTOMER_ORDER_KEY_PREFIX}.${sessionCode.toUpperCase()}`);
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

export const normalizeSessionCode = (value: string) => {
  return value
    .toUpperCase()
    .replace(/[^A-Z2-9]/g, "")
    .slice(0, 6);
};

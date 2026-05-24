import { isAxiosError } from "axios";

import type { ApiProblemDetails, JoinSessionResponse, PersistedCustomerSession } from "@/types/customer-session";

const CUSTOMER_SESSION_KEY = "scan-now.customer-session";
const CUSTOMER_ORDER_KEY_PREFIX = "scan-now.customer-order";

export const getCustomerApiErrorMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError<ApiProblemDetails>(error)) {
    return fallback;
  }

  const data = error.response?.data;
  const firstValidationError = data?.errors ? Object.values(data.errors).flat()[0] : undefined;

  return firstValidationError ?? data?.detail ?? data?.message ?? data?.title ?? fallback;
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
  window.localStorage.setItem(`${CUSTOMER_ORDER_KEY_PREFIX}.${sessionCode.toUpperCase()}`, orderId);
};

export const readPersistedCustomerOrder = (sessionCode: string) => {
  return window.localStorage.getItem(`${CUSTOMER_ORDER_KEY_PREFIX}.${sessionCode.toUpperCase()}`);
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

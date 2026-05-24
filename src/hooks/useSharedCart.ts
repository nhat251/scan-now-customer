"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { showNotify } from "@/stores/global";
import { type CartDto,EMPTY_CART } from "@/types/cart";
import * as signalR from "@microsoft/signalr";

type CartConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

const getCartHubUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

  return `${baseUrl ?? ""}/hubs/cart`;
};

const normalizeCart = (cart?: Partial<CartDto> | null): CartDto => {
  const items = cart?.items ?? [];
  const totalAmount = cart?.totalAmount ?? items.reduce((total, item) => total + item.price * item.quantity, 0);

  return { items, totalAmount };
};

export const recalculateCart = (cart: CartDto): CartDto => ({
  items: cart.items.filter((item) => item.quantity > 0),
  totalAmount: cart.items.reduce((total, item) => total + item.price * item.quantity, 0),
});

export const useSharedCart = (sessionCode: string) => {
  const normalizedSessionCode = useMemo(() => sessionCode.trim().toUpperCase(), [sessionCode]);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const joinedSessionRef = useRef("");
  const [cart, setCart] = useState<CartDto>(EMPTY_CART);
  const [status, setStatus] = useState<CartConnectionStatus>("idle");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!normalizedSessionCode) {
      return;
    }

    let mounted = true;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(getCartHubUrl())
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;
    setStatus("connecting");

    connection.on("CartUpdated", (updatedCart: CartDto) => {
      if (mounted) {
        setCart(normalizeCart(updatedCart));
      }
    });

    connection.on("CartCleared", () => {
      if (mounted) {
        setCart(EMPTY_CART);
      }
    });

    connection.onreconnecting(() => {
      if (mounted) {
        setStatus("reconnecting");
      }
    });

    connection.onreconnected(async () => {
      if (!mounted) {
        return;
      }

      setStatus("connected");

      try {
        const currentCart = await connection.invoke<CartDto>("JoinSession", normalizedSessionCode);
        joinedSessionRef.current = normalizedSessionCode;
        setCart(normalizeCart(currentCart));
      } catch {
        setStatus("error");
      }
    });

    connection.onclose(() => {
      if (mounted) {
        setStatus("disconnected");
      }
    });

    const start = async () => {
      try {
        await connection.start();
        const currentCart = await connection.invoke<CartDto>("JoinSession", normalizedSessionCode);

        if (!mounted) {
          return;
        }

        joinedSessionRef.current = normalizedSessionCode;
        setCart(normalizeCart(currentCart));
        setStatus("connected");
      } catch {
        if (mounted) {
          setStatus("error");
          showNotify({ type: "error", message: "Unable to connect shared cart." });
        }
      }
    };

    void start();

    return () => {
      mounted = false;
      const activeConnection = connectionRef.current;
      connectionRef.current = null;

      if (activeConnection?.state === signalR.HubConnectionState.Connected && joinedSessionRef.current) {
        void activeConnection
          .invoke("LeaveSession", joinedSessionRef.current)
          .finally(() => activeConnection.stop());
      } else {
        void activeConnection?.stop();
      }
    };
  }, [normalizedSessionCode]);

  const updateCart = useCallback(
    async (nextCart: CartDto) => {
      const normalizedCart = recalculateCart(nextCart);

      setCart(normalizedCart);

      const connection = connectionRef.current;

      if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        showNotify({ type: "warning", message: "Shared cart is reconnecting. Please try again." });
        return;
      }

      try {
        setIsUpdating(true);
        await connection.invoke("UpdateCart", normalizedSessionCode, normalizedCart);
      } catch {
        showNotify({ type: "error", message: "Unable to update shared cart." });
      } finally {
        setIsUpdating(false);
      }
    },
    [normalizedSessionCode]
  );

  const clearCart = useCallback(async () => {
    setCart(EMPTY_CART);

    const connection = connectionRef.current;

    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      showNotify({ type: "warning", message: "Shared cart is reconnecting. Please try again." });
      return;
    }

    try {
      setIsUpdating(true);
      await connection.invoke("ClearCart", normalizedSessionCode);
    } catch {
      showNotify({ type: "error", message: "Unable to clear shared cart." });
    } finally {
      setIsUpdating(false);
    }
  }, [normalizedSessionCode]);

  return {
    cart,
    status,
    isUpdating,
    updateCart,
    clearCart,
  };
};

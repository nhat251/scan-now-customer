"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { QUERY_KEY } from "@/constants/queryKeys";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type { CustomerOrderResponse } from "@/types/order";
import * as signalR from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";

type OrderConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

const getOrderHubUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

  return `${baseUrl ?? ""}/hubs/orders`;
};

export const useOrderUpdates = (sessionCode: string, orderId: string) => {
  const normalizedSessionCode = useMemo(() => sessionCode.trim().toUpperCase(), [sessionCode]);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const joinedOrderRef = useRef("");
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<OrderConnectionStatus>("idle");
  const [latestOrder, setLatestOrder] = useState<CustomerOrderResponse | null>(null);

  const updateOrderCache = useCallback(
    (order: CustomerOrderResponse) => {
      setLatestOrder(order);
      queryClient.setQueryData(
        [QUERY_KEY.PUBLIC_ORDER, normalizedSessionCode, orderId],
        (current: { data?: ApiResponse<CustomerOrderResponse> } | undefined) => {
          if (!current?.data) {
            return current;
          }

          return {
            ...current,
            data: {
              ...current.data,
              result: order,
            },
          };
        }
      );
    },
    [normalizedSessionCode, orderId, queryClient]
  );

  useEffect(() => {
    if (!normalizedSessionCode || !orderId) {
      return;
    }

    let mounted = true;
    setLatestOrder(null);
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(getOrderHubUrl())
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;
    setStatus("connecting");

    connection.on("OrderUpdated", (order: CustomerOrderResponse) => {
      if (mounted && order.orderId === orderId) {
        updateOrderCache(order);
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

      try {
        const order = await connection.invoke<CustomerOrderResponse>(
          "JoinOrder",
          normalizedSessionCode,
          orderId
        );

        if (!mounted) {
          return;
        }

        joinedOrderRef.current = orderId;
        updateOrderCache(order);
        setStatus("connected");
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
        const order = await connection.invoke<CustomerOrderResponse>(
          "JoinOrder",
          normalizedSessionCode,
          orderId
        );

        if (!mounted) {
          return;
        }

        joinedOrderRef.current = orderId;
        updateOrderCache(order);
        setStatus("connected");
      } catch {
        if (mounted) {
          setStatus("error");
          showNotify({
            type: "warning",
            message: "Không thể kết nối cập nhật trực tiếp của đơn hàng.",
          });
        }
      }
    };

    void start();

    return () => {
      mounted = false;
      const activeConnection = connectionRef.current;
      connectionRef.current = null;

      if (
        activeConnection?.state === signalR.HubConnectionState.Connected &&
        joinedOrderRef.current
      ) {
        void activeConnection
          .invoke("LeaveOrder", joinedOrderRef.current)
          .finally(() => activeConnection.stop());
      } else {
        void activeConnection?.stop();
      }
    };
  }, [normalizedSessionCode, orderId, updateOrderCache]);

  return { status, latestOrder };
};

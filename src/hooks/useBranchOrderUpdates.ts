"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { showNotify } from "@/stores/global";
import type { CustomerOrderResponse } from "@/types/order";
import * as signalR from "@microsoft/signalr";

type BranchOrderConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

type UseBranchOrderUpdatesOptions = {
  enabled?: boolean;
  onOrderUpdated?: (order: CustomerOrderResponse) => void;
};

const getOrderHubUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

  return `${baseUrl ?? ""}/hubs/orders`;
};

export const useBranchOrderUpdates = (
  branchId?: string,
  { enabled = true, onOrderUpdated }: UseBranchOrderUpdatesOptions = {}
) => {
  const normalizedBranchId = useMemo(() => branchId?.trim().toLowerCase() ?? "", [branchId]);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const joinedBranchRef = useRef("");
  const latestHandlerRef = useRef(onOrderUpdated);
  const [status, setStatus] = useState<BranchOrderConnectionStatus>("idle");

  useEffect(() => {
    latestHandlerRef.current = onOrderUpdated;
  }, [onOrderUpdated]);

  useEffect(() => {
    if (!enabled || !normalizedBranchId) {
      return;
    }

    let mounted = true;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(getOrderHubUrl())
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;
    setStatus("connecting");

    connection.on("BranchOrderUpdated", (order: CustomerOrderResponse) => {
      if (mounted && order.branchId.toLowerCase() === normalizedBranchId) {
        latestHandlerRef.current?.(order);
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
        await connection.invoke("JoinBranch", normalizedBranchId);
        joinedBranchRef.current = normalizedBranchId;
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
        await connection.invoke("JoinBranch", normalizedBranchId);

        if (!mounted) {
          return;
        }

        joinedBranchRef.current = normalizedBranchId;
        setStatus("connected");
      } catch {
        if (mounted) {
          setStatus("error");
          showNotify({ type: "warning", message: "Unable to connect real-time branch order updates. Using refresh fallback." });
        }
      }
    };

    void start();

    return () => {
      mounted = false;
      const activeConnection = connectionRef.current;
      connectionRef.current = null;

      if (activeConnection?.state === signalR.HubConnectionState.Connected && joinedBranchRef.current) {
        void activeConnection
          .invoke("LeaveBranch", joinedBranchRef.current)
          .finally(() => activeConnection.stop());
      } else {
        void activeConnection?.stop();
      }
    };
  }, [enabled, normalizedBranchId]);

  return { status };
};

"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Utensils } from "lucide-react";

import { Logo } from "@/components/atoms/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJoinPublicSessionMutation } from "@/hooks/mutations/usePublicCustomerMutations";
import { usePublicTableQuery } from "@/hooks/queries/usePublicCustomerQueries";
import { cn } from "@/lib/utils";
import type { TableStatus } from "@/types/customer-session";

import {
  getCustomerApiErrorMessage,
  normalizeSessionCode,
  persistCustomerSession,
} from "./customer-session-utils";

type Props = {
  qrCodeToken: string;
};

const STATUS_CONTENT: Record<
  TableStatus,
  {
    label: string;
    description: string;
    helper: string;
    canJoin: boolean;
  }
> = {
  AVAILABLE: {
    label: "Available",
    description: "This table has not started a session yet.",
    helper: "Please contact staff to begin.",
    canJoin: false,
  },
  OCCUPIED: {
    label: "Occupied",
    description: "Enter the session code to view menu and place orders.",
    helper: "Ask staff for the 6-character code on your receipt or table display.",
    canJoin: true,
  },
  RESERVED: {
    label: "Reserved",
    description: "This table is currently reserved.",
    helper: "Please contact staff if you need help.",
    canJoin: false,
  },
  DISABLED: {
    label: "Unavailable",
    description: "This table is currently unavailable.",
    helper: "Please contact staff for another table.",
    canJoin: false,
  },
};

const TABLE_STATUS_BY_CODE: Record<number, TableStatus> = {
  0: "AVAILABLE",
  1: "OCCUPIED",
  2: "RESERVED",
  3: "DISABLED",
};

const normalizeTableStatus = (status: TableStatus | number): TableStatus | undefined => {
  if (typeof status === "number") {
    return TABLE_STATUS_BY_CODE[status];
  }

  return STATUS_CONTENT[status] ? status : undefined;
};

export const TableSessionPage = ({ qrCodeToken }: Props) => {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState("");
  const [formError, setFormError] = useState("");
  const tableQuery = usePublicTableQuery(qrCodeToken);
  const joinSessionMutation = useJoinPublicSessionMutation();

  const table = tableQuery.data;
  const tableStatus = table ? normalizeTableStatus(table.status) : undefined;
  const statusContent = tableStatus ? STATUS_CONTENT[tableStatus] : undefined;
  const canSubmit = Boolean(statusContent?.canJoin) && sessionCode.length === 6 && !joinSessionMutation.isPending;

  const statusTone = useMemo(() => {
    if (!tableStatus) {
      return "bg-surface-container-low text-muted-foreground border-border";
    }

    if (tableStatus === "OCCUPIED") {
      return "border-primary-container/20 bg-primary-container/10 text-primary";
    }

    if (tableStatus === "AVAILABLE") {
      return "border-success/70 bg-success text-success-foreground";
    }

    return "border-warning/70 bg-warning text-warning-foreground";
  }, [tableStatus]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!/^[A-Z2-9]{6}$/.test(sessionCode)) {
      setFormError("sessionCode must be 6 uppercase characters");
      return;
    }

    try {
      const response = await joinSessionMutation.mutateAsync({ sessionCode });
      persistCustomerSession(sessionCode, response.result);
      router.push(`/sessions/${sessionCode}/menu`);
    } catch (error) {
      setFormError(getCustomerApiErrorMessage(error, "Unable to join this session."));
    }
  };

  return (
    <main className="fixed inset-0 z-[60] overflow-y-auto bg-[#f8f9fa] font-sans text-gray-900">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col pb-24">
        <header className="sticky top-0 z-20 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
          <Logo size={16} textSize="text-xl" />
          <div className="text-primary-container flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-sm font-bold">
            <Utensils className="size-4" />
            {table ? `Bàn ${table.tableNumber}` : "Bàn"}
          </div>
        </header>

        <section className="mt-4 px-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-primary-container text-sm font-bold">ScanNow Digital Menu</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
              {tableQuery.isLoading ? "Đang tải bàn" : table?.branchName ?? "ScanNow Menu"}
            </h1>
            <p className="mt-1 text-sm font-semibold text-gray-500">
              {table ? `Bàn ${table.tableNumber}` : "Quét QR để vào phiên dùng bữa"}
            </p>
          </div>
        </section>

        <section className="mt-6 px-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="truncate text-xl font-bold text-gray-800">Thông tin bàn</h2>
          </div>

          <div className="rounded-2xl border border-gray-50 bg-white p-3 shadow-sm">
            {tableQuery.isLoading ? (
              <div className="flex min-h-52 items-center justify-center">
                <Loader2 className="text-primary-container size-8 animate-spin" />
              </div>
            ) : null}

            {tableQuery.isError ? (
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <AlertCircle className="text-destructive size-10" />
                <h2 className="mt-3 text-xl font-bold">Table not found</h2>
                <p className="mt-2 text-sm text-gray-500">
                  {getCustomerApiErrorMessage(tableQuery.error, "Table not found")}
                </p>
                <Button className="mt-5 rounded-2xl" onClick={() => tableQuery.refetch()} disabled={tableQuery.isRefetching}>
                  Try again
                </Button>
              </div>
            ) : null}

            {table && !tableQuery.isError && !statusContent ? (
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <AlertCircle className="text-destructive size-10" />
                <h2 className="mt-3 text-xl font-bold">Unsupported table status</h2>
                <p className="mt-2 text-sm text-gray-500">
                  This table returned status "{String(table.status)}". Please contact staff.
                </p>
              </div>
            ) : null}

            {table && statusContent ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-500">Chi nhánh</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900">{table.branchName}</h2>
                    <p className="text-primary-container mt-1 text-sm font-semibold">Bàn {table.tableNumber}</p>
                  </div>
                  <span className={cn("rounded-full border px-3 py-1 text-xs font-bold", statusTone)}>
                    {statusContent.label}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <div className="flex gap-3">
                    {statusContent.canJoin ? (
                      <CheckCircle2 className="text-primary-container mt-0.5 size-5 shrink-0" />
                    ) : (
                      <AlertCircle className="text-warning-foreground mt-0.5 size-5 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{statusContent.description}</p>
                      <p className="mt-1 text-sm text-gray-600">{statusContent.helper}</p>
                    </div>
                  </div>
                </div>

                <form className="mt-5" onSubmit={handleSubmit}>
                  <label htmlFor="session-code" className="text-sm font-bold text-gray-900">
                    Enter session code
                  </label>
                  <Input
                    id="session-code"
                    value={sessionCode}
                    onChange={(event) => setSessionCode(normalizeSessionCode(event.target.value))}
                    placeholder="A7X9K2"
                    inputMode="text"
                    autoComplete="one-time-code"
                    disabled={!statusContent.canJoin || joinSessionMutation.isPending}
                    className="mt-2 h-14 rounded-2xl border-gray-200 bg-white text-center text-2xl font-black tracking-[0.35em] text-gray-900 placeholder:tracking-normal"
                    aria-invalid={Boolean(formError)}
                  />
                  {formError ? <p className="text-destructive mt-2 text-sm font-medium">{formError}</p> : null}
                  <Button type="submit" className="mt-4 h-14 w-full rounded-2xl text-base font-bold" disabled={!canSubmit}>
                    {joinSessionMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : null}
                    View Menu
                  </Button>
                </form>
              </>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
};

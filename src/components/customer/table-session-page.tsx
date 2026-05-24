"use client";

import { type FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, MapPin, QrCode, Store, Utensils } from "lucide-react";

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
    <main className="bg-background text-on-background fixed inset-0 z-[60] overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
        <header className="border-border/70 bg-card sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-primary-container text-on-primary flex size-9 items-center justify-center rounded-xl">
              <QrCode className="size-5" />
            </div>
            <span className="text-primary-container text-xl font-black tracking-tight">ScanNow</span>
          </div>
          <div className="border-primary-container/20 bg-primary-container/10 text-primary flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold">
            <Utensils className="size-4" />
            {table ? `Table ${table.tableNumber}` : "Table"}
          </div>
        </header>

        <section className="flex flex-1 flex-col px-4 py-5">
          <div className="bg-inverse-surface relative h-48 overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80"
              alt="Restaurant table"
              fill
              sizes="(max-width: 640px) 100vw, 448px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/35 to-transparent p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white/90">
                <Store className="size-4" />
                Dining session
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {tableQuery.isLoading ? "Loading table" : table?.branchName ?? "ScanNow Menu"}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-white/85">
                <MapPin className="size-4" />
                {table ? `Table ${table.tableNumber}` : "QR table access"}
              </div>
            </div>
          </div>

          <div className="border-border/70 bg-card mt-5 rounded-2xl border p-4 shadow-sm">
            {tableQuery.isLoading ? (
              <div className="flex min-h-52 items-center justify-center">
                <Loader2 className="text-primary-container size-8 animate-spin" />
              </div>
            ) : null}

            {tableQuery.isError ? (
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <AlertCircle className="text-destructive size-10" />
                <h2 className="mt-3 text-xl font-bold">Table not found</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  {getCustomerApiErrorMessage(tableQuery.error, "Table not found")}
                </p>
                <Button className="mt-5" onClick={() => tableQuery.refetch()} disabled={tableQuery.isRefetching}>
                  Try again
                </Button>
              </div>
            ) : null}

            {table && !tableQuery.isError && !statusContent ? (
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <AlertCircle className="text-destructive size-10" />
                <h2 className="mt-3 text-xl font-bold">Unsupported table status</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  This table returned status "{String(table.status)}". Please contact staff.
                </p>
              </div>
            ) : null}

            {table && statusContent ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-muted-foreground text-sm font-semibold">Branch</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight">{table.branchName}</h2>
                    <p className="text-primary mt-1 text-sm font-semibold">Table {table.tableNumber}</p>
                  </div>
                  <span className={cn("rounded-full border px-3 py-1 text-xs font-bold", statusTone)}>
                    {statusContent.label}
                  </span>
                </div>

                <div className="border-border bg-surface-container-low mt-5 rounded-2xl border p-4">
                  <div className="flex gap-3">
                    {statusContent.canJoin ? (
                      <CheckCircle2 className="text-primary-container mt-0.5 size-5 shrink-0" />
                    ) : (
                      <AlertCircle className="text-warning-foreground mt-0.5 size-5 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold">{statusContent.description}</p>
                      <p className="text-muted-foreground mt-1 text-sm">{statusContent.helper}</p>
                    </div>
                  </div>
                </div>

                <form className="mt-5" onSubmit={handleSubmit}>
                  <label htmlFor="session-code" className="text-on-surface text-sm font-bold">
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
                    className="border-border text-on-surface mt-2 h-14 rounded-2xl bg-white text-center text-2xl font-black tracking-[0.35em] placeholder:tracking-normal"
                    aria-invalid={Boolean(formError)}
                  />
                  {formError ? <p className="text-destructive mt-2 text-sm font-medium">{formError}</p> : null}
                  <Button type="submit" className="mt-4 h-14 w-full rounded-2xl text-base" disabled={!canSubmit}>
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

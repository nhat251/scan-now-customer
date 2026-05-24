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
    label: "Sẵn sàng",
    description: "Bàn này chưa bắt đầu phiên dùng bữa.",
    helper: "Vui lòng liên hệ nhân viên để bắt đầu.",
    canJoin: false,
  },
  OCCUPIED: {
    label: "Đang phục vụ",
    description: "Nhập mã phiên để xem thực đơn và gọi món.",
    helper: "Mã gồm 6 ký tự, được cung cấp bởi nhân viên hoặc hiển thị tại bàn.",
    canJoin: true,
  },
  RESERVED: {
    label: "Đã đặt trước",
    description: "Bàn này hiện đang được đặt trước.",
    helper: "Vui lòng liên hệ nhân viên nếu bạn cần hỗ trợ.",
    canJoin: false,
  },
  DISABLED: {
    label: "Không khả dụng",
    description: "Bàn này hiện không thể sử dụng.",
    helper: "Vui lòng liên hệ nhân viên để được sắp xếp bàn khác.",
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
      setFormError("Mã phiên phải gồm 6 ký tự viết hoa hợp lệ.");
      return;
    }

    try {
      const response = await joinSessionMutation.mutateAsync({ sessionCode });
      persistCustomerSession(sessionCode, response.result);
      router.push(`/sessions/${sessionCode}/menu`);
    } catch (error) {
      setFormError(getCustomerApiErrorMessage(error, "Không thể tham gia phiên dùng bữa này."));
    }
  };

  return (
    <main className="fixed inset-0 z-[60] overflow-y-auto bg-gradient-to-b from-orange-50/70 via-[#f8f9fa] to-[#f8f9fa] font-sans text-gray-900">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col pb-24">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-orange-50 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md">
          <Logo size={16} textSize="text-xl" />
          <div className="text-primary-container flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-sm font-bold">
            <Utensils className="size-4" />
            {table ? `Bàn ${table.tableNumber}` : "Bàn"}
          </div>
        </header>

        <section className="mt-4 px-4">
          <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white shadow-lg shadow-orange-200/70">
            <p className="text-sm font-bold text-orange-100">ScanNow · Thực đơn điện tử</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
              {tableQuery.isLoading ? "Đang tải thông tin bàn" : table?.branchName ?? "ScanNow"}
            </h1>
            <p className="mt-1 text-sm font-semibold text-orange-50">
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
                <h2 className="mt-3 text-xl font-bold">Không tìm thấy bàn</h2>
                <p className="mt-2 text-sm text-gray-500">
                  {getCustomerApiErrorMessage(tableQuery.error, "Mã QR không hợp lệ hoặc bàn không còn khả dụng.")}
                </p>
                <Button className="mt-5 rounded-2xl" onClick={() => tableQuery.refetch()} disabled={tableQuery.isRefetching}>
                  Thử lại
                </Button>
              </div>
            ) : null}

            {table && !tableQuery.isError && !statusContent ? (
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <AlertCircle className="text-destructive size-10" />
                <h2 className="mt-3 text-xl font-bold">Trạng thái bàn chưa được hỗ trợ</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Bàn trả về trạng thái "{String(table.status)}". Vui lòng liên hệ nhân viên.
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
                    Nhập mã phiên dùng bữa
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
                    Xem thực đơn
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

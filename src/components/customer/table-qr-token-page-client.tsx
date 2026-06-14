"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { AlertTriangle, QrCode, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { Log } from "@/lib/log";
import { getPublicTable, joinTableByQr } from "@/services/public-ordering";
import type { PublicTableResponse } from "@/types/public-ordering";

export const TableQrTokenPageClient = ({ qrCodeToken }: { qrCodeToken: string }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<"none" | "invalid" | "not_open">("none");
  const [tableInfo, setTableInfo] = useState<PublicTableResponse | null>(null);

  const handleJoin = useCallback(async () => {
    setLoading(true);
    setErrorType("none");
    try {
      try {
        const tableRes = await getPublicTable(qrCodeToken);
        if (tableRes.result) {
          setTableInfo(tableRes.result);
        }
      } catch (err) {
        Log.error({ prefix: "TableQrToken", message: "Không thể tải thông tin bàn.", data: err });
      }

      const joinRes = await joinTableByQr(qrCodeToken);
      if (joinRes.result && joinRes.result.sessionCode) {
        router.replace(PATH.customer.menu(joinRes.result.sessionCode));
      } else {
        setErrorType("not_open");
        setLoading(false);
      }
    } catch (err: unknown) {
      Log.error({ prefix: "TableQrToken", message: "Không thể tham gia bàn.", data: err });
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 404) {
          setErrorType("invalid");
        } else {
          setErrorType("not_open");
        }
      } else {
        setErrorType("not_open");
      }
      setLoading(false);
    }
  }, [qrCodeToken, router]);

  useEffect(() => {
    handleJoin();
  }, [handleJoin]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 px-4 py-8 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          {loading && (
            <div className="flex flex-col items-center space-y-6 py-8">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 ring-8 ring-indigo-500/5">
                <QrCode className="h-10 w-10 animate-pulse" />
                <div className="absolute inset-0 animate-ping rounded-full border border-indigo-400/30" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-wide text-white">
                  Đang kiểm tra bàn...
                </h2>
                <p className="text-sm text-slate-400">Vui lòng chờ trong giây lát</p>
              </div>
              <Spinner className="h-6 w-6 text-indigo-400" />
            </div>
          )}

          {!loading && errorType === "invalid" && (
            <div className="flex flex-col items-center space-y-6 py-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 ring-8 ring-rose-500/5">
                <AlertTriangle className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-wide text-white">
                  Mã QR không hợp lệ
                </h2>
                <p className="px-4 text-sm text-slate-400">
                  Mã QR không tồn tại, đã hết hạn hoặc bàn này đã ngừng hoạt động.
                </p>
              </div>
              <Button
                onClick={handleJoin}
                className="mt-4 w-full bg-rose-600 font-medium text-white shadow-lg shadow-rose-900/20 hover:bg-rose-500"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
              </Button>
            </div>
          )}

          {!loading && errorType === "not_open" && (
            <div className="flex w-full flex-col items-center space-y-6 py-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 ring-8 ring-amber-500/5">
                <AlertTriangle className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-wide text-white">
                  Bàn chưa sẵn sàng
                </h2>
                <p className="px-4 text-sm text-slate-400">
                  Bàn này chưa được mở phiên gọi món. Vui lòng gọi nhân viên mở bàn để bắt đầu đặt
                  món.
                </p>
              </div>

              {tableInfo && (
                <div className="w-full space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-left text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chi nhánh:</span>
                    <span className="font-semibold text-white">{tableInfo.branchName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số bàn:</span>
                    <span className="font-bold text-indigo-400">{tableInfo.tableNumber}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleJoin}
                className="mt-4 w-full bg-amber-600 font-medium text-white shadow-lg shadow-amber-900/20 hover:bg-amber-500"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { QrCode } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 px-4 py-8 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center space-y-6 py-8 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 ring-8 ring-indigo-500/5">
            <QrCode className="h-10 w-10 animate-pulse" />
            <div className="absolute inset-0 animate-ping rounded-full border border-indigo-400/30" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-wide text-white">Đang kiểm tra bàn...</h2>
            <p className="text-sm text-slate-400">Vui lòng chờ trong giây lát</p>
          </div>
          <Spinner className="h-6 w-6 text-indigo-400" />
        </div>
      </div>
    </div>
  );
}

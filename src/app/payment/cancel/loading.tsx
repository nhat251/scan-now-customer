import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
      <Spinner className="h-10 w-10 text-indigo-500" />
      <p className="mt-4 text-sm text-slate-400">Đang xử lý hủy thanh toán...</p>
    </div>
  );
}

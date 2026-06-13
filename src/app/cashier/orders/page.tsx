import Link from "next/link";
import { ChevronLeft, Receipt } from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";

const CashierOrdersPage = () => {
  return (
    <ProtectedRoute allowedRoles={["CASHIER"]}>
      <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <Link href="/cashier/dashboard" className="text-slate-400 hover:text-white">
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <div>
                <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">
                  ScanNow Cashier
                </span>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">
                  Danh sách hóa đơn
                </h1>
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-right">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Vai trò</p>
              <p className="text-sm font-bold text-indigo-400">Thu ngân (Cashier)</p>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
              <Receipt className="h-8 w-8" />
            </div>
            <div className="mx-auto max-w-md space-y-2">
              <h3 className="text-xl font-bold text-white">Chưa có hóa đơn nào</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                Màn hình quản lý hóa đơn và danh sách thanh toán của thu ngân đang được chuẩn bị. Dữ
                liệu thực tế sẽ được hiển thị khi kết nối cổng PayOS hoàn tất.
              </p>
            </div>
            <div className="pt-4">
              <Link href="/cashier/dashboard">
                <Button
                  variant="ghost"
                  className="border border-slate-800 text-slate-300 hover:text-white"
                >
                  Quay lại bảng điều khiển
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CashierOrdersPage;

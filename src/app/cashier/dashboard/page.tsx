import Link from "next/link";
import { ArrowLeftRight, Receipt } from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";

const CashierDashboardPage = () => {
  return (
    <ProtectedRoute allowedRoles={["CASHIER"]}>
      <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">
                ScanNow Cashier
              </span>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">
                Bảng điều khiển thu ngân
              </h1>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-right">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Vai trò</p>
              <p className="text-sm font-bold text-indigo-400">Thu ngân (Cashier)</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition duration-300 hover:border-slate-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <Receipt className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Quản lý hóa đơn</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                Xem danh sách hóa đơn, xác nhận thanh toán tiền mặt từ khách hàng tại bàn và in hóa
                đơn.
              </p>
              <Link href="/cashier/orders" className="block pt-2">
                <Button className="w-full bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-900/20 hover:bg-indigo-500">
                  Truy cập Hóa đơn
                </Button>
              </Link>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition duration-300 hover:border-slate-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <ArrowLeftRight className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Lịch sử giao dịch</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                Xem toàn bộ lịch sử giao dịch thanh toán trong ngày, doanh số thu ngân và các kết
                nối PayOS.
              </p>
              <Button
                disabled
                className="w-full cursor-not-allowed border border-slate-800 font-semibold text-slate-500"
              >
                Đang phát triển...
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CashierDashboardPage;

import { UserCircle2 } from "lucide-react";

import { WaiterCard } from "@/components/waiter/waiter-card";
import { WaiterInfoRow } from "@/components/waiter/waiter-info-row";
import { getRoleLabel } from "@/constants/roleLabels";

export function WaiterProfileView({
  currentUser,
  activeBranchId,
  branchName,
}: {
  currentUser: { fullName?: string; role?: string; email?: string | null } | null;
  activeBranchId: string;
  branchName: string;
}) {
  return (
    <div className="h-full overflow-y-auto p-6 pb-28">
      <WaiterCard className="rounded-[28px] p-6">
        <div className="flex items-center gap-4">
          <div className="border-primary-container/10 bg-primary-container/20 text-primary-container flex size-20 items-center justify-center rounded-full border-4">
            <UserCircle2 className="size-12" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-black">{currentUser?.fullName ?? "Nhân viên"}</h2>
            <p className="bg-primary-container/10 text-primary-container mt-1 inline-block rounded-full px-2 py-1 text-[11px] font-bold">
              {getRoleLabel(currentUser?.role)}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-stone-500">{currentUser?.email ?? "Không có email"}</p>
      </WaiterCard>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <WaiterCard className="rounded-[28px] p-4 text-center">
          <p className="text-[11px] font-bold tracking-[0.18em] text-stone-500 uppercase">
            Chi nhánh
          </p>
          <p className="text-primary-container mt-2 text-lg font-black">{branchName}</p>
        </WaiterCard>
        <WaiterCard className="rounded-[28px] p-4 text-center">
          <p className="text-[11px] font-bold tracking-[0.18em] text-stone-500 uppercase">
            Vai trò
          </p>
          <p className="mt-2 text-lg font-black text-orange-600">
            {getRoleLabel(currentUser?.role)}
          </p>
        </WaiterCard>
      </div>

      <div className="mt-6 space-y-3">
        <WaiterInfoRow label="Chi nhánh" value={branchName} />
        <WaiterInfoRow label="Mã chi nhánh" value={activeBranchId} />
        <WaiterInfoRow label="Email" value={currentUser?.email ?? "-"} />
      </div>
    </div>
  );
}

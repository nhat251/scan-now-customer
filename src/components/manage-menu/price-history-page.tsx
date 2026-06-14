"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign } from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import {
  useManageMenuItemQuery,
  useManagePriceHistoryQuery,
} from "@/hooks/queries/useManageMenuQueries";
import { useUserStore } from "@/stores/user";

import {
  formatCurrency,
  formatDateTime,
  getManageApiErrorMessage,
  getManageMenuNavItems,
  getMenuItemDetailPath,
  getPortalCopy,
  isForbiddenError,
  type ManagePortal,
} from "./helpers";
import { UpdatePriceDialog } from "./update-price-dialog";

type PriceHistoryPageProps = {
  menuItemId: string;
  portal: ManagePortal;
};

export const PriceHistoryPage = ({ menuItemId, portal }: PriceHistoryPageProps) => {
  const currentUser = useUserStore((state) => state.user);
  const copy = getPortalCopy(portal);
  const itemQuery = useManageMenuItemQuery(menuItemId);
  const historyQuery = useManagePriceHistoryQuery(menuItemId);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const item = itemQuery.data;
  const history = historyQuery.data ?? [];

  return (
    <PortalShell
      title="Lịch sử giá"
      description="Xem lịch sử thay đổi và cập nhật giá món."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getManageMenuNavItems(portal, "menu-items", item?.branchId)}
      topbarTitle={currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      headerAction={
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={getMenuItemDetailPath(portal, menuItemId)}>
              <ArrowLeft className="size-4" />
              Tổng quan
            </Link>
          </Button>
          {item ? (
            <Button onClick={() => setPriceDialogOpen(true)}>
              <DollarSign className="size-4" />
              Cập nhật giá
            </Button>
          ) : null}
        </div>
      }
      stats={
        <>
          <PortalStatCard
            label="Giá hiện tại"
            value={item ? formatCurrency(item.price) : "-"}
            helper={item?.name ?? "Đang tải món"}
          />
          <PortalStatCard
            label="Số lần thay đổi"
            value={String(history.length)}
            helper="Lịch sử giá từ hệ thống"
          />
          <PortalStatCard
            label="Chi nhánh"
            value={item?.branchName ?? "-"}
            helper="Hệ thống kiểm tra phạm vi truy cập"
          />
          <PortalStatCard
            label="Danh mục"
            value={item?.categoryName ?? "-"}
            helper="Danh mục của món"
          />
        </>
      }
    >
      {itemQuery.isError || historyQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6 text-sm">
          {isForbiddenError(itemQuery.error) || isForbiddenError(historyQuery.error)
            ? "Bạn không có quyền truy cập chi nhánh này"
            : getManageApiErrorMessage(
                itemQuery.error ?? historyQuery.error,
                "Không thể tải lịch sử giá."
              )}
        </div>
      ) : null}

      <section className="bg-card border-border/60 overflow-hidden rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="divide-border/60 min-w-full divide-y text-left">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Giá cũ</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Giá mới</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">
                  Người thay đổi
                </th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">
                  Thời gian thay đổi
                </th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-border/40 divide-y">
              {historyQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="text-muted-foreground px-6 py-10 text-center text-sm">
                    Đang tải lịch sử giá...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted-foreground px-6 py-10 text-center text-sm">
                    Chưa có lịch sử giá.
                  </td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.priceHistoryId} className="hover:bg-muted/30">
                    <td className="px-6 py-4 text-sm">{formatCurrency(row.oldPrice)}</td>
                    <td className="px-6 py-4 text-sm font-bold">{formatCurrency(row.newPrice)}</td>
                    <td className="px-6 py-4 text-sm">{row.changedByName || row.changedById}</td>
                    <td className="px-6 py-4 text-sm">{formatDateTime(row.changedAt)}</td>
                    <td className="px-6 py-4 text-sm">{row.note || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {item ? (
        <UpdatePriceDialog
          menuItemId={menuItemId}
          currentPrice={item.price}
          open={priceDialogOpen}
          onOpenChange={setPriceDialogOpen}
        />
      ) : null}
    </PortalShell>
  );
};

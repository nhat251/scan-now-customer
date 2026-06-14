"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  CreditCard,
  Gift,
  QrCode,
  RefreshCw,
  Save,
  TicketPercent,
  WalletCards,
} from "lucide-react";
import { useForm } from "react-hook-form";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import {
  formatCurrency,
  getManageMenuNavItems,
  getPortalCopy,
  type ManagePortal,
} from "@/components/manage-menu/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { QUERY_KEY } from "@/constants/queryKeys";
import {
  useCreatePaperVoucherMutation,
  useUpsertBranchPaymentConfigMutation,
} from "@/hooks/mutations/useBranchSettingsMutations";
import {
  useBranchPaymentConfigQuery,
  usePaperVouchersQuery,
} from "@/hooks/queries/useBranchSettingsQueries";
import { useMyBranchesListQuery } from "@/hooks/queries/useMeQueries";
import { useOwnerBranchListQuery } from "@/hooks/queries/useOwnerBranchListQuery";
import { cn } from "@/lib/utils";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type {
  PaperVoucherRequest,
  PaperVoucherResponse,
  UpsertBranchPaymentConfigRequest,
} from "@/types/branch-settings";
import type { BranchResponse } from "@/types/user-management";
import { useQueryClient } from "@tanstack/react-query";

import { VoucherMetric } from "./voucher-metric";

type BranchSettingsPageProps = {
  portal: ManagePortal;
};

const emptyVoucher: PaperVoucherRequest = {
  code: "",
  name: "",
  description: "",
  discountType: "PERCENT",
  discountValue: 10,
  minOrderAmount: 0,
  maxDiscountAmount: null,
  quantity: 1,
  validFrom: null,
  validUntil: null,
  isActive: true,
};

const toDateStart = (value?: string | null) => (value ? `${value}T00:00:00` : null);
const toDateEnd = (value?: string | null) => (value ? `${value}T23:59:59.999` : null);

const toVoucherPayload = (value: PaperVoucherRequest): PaperVoucherRequest => ({
  ...value,
  code: value.code.trim().toUpperCase(),
  name: value.name.trim(),
  description: value.description?.trim() || null,
  validFrom: toDateStart(value.validFrom),
  validUntil: toDateEnd(value.validUntil),
});

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Không giới hạn";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Không hợp lệ";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatVoucherDiscount = (
  voucher: Pick<PaperVoucherResponse, "discountType" | "discountValue">
) => {
  return voucher.discountType === "PERCENT"
    ? `${voucher.discountValue}%`
    : formatCurrency(voucher.discountValue);
};

export const BranchSettingsPage = ({ portal }: BranchSettingsPageProps) => {
  const queryClient = useQueryClient();
  const currentUser = useUserStore((state) => state.user);
  const copy = getPortalCopy(portal);
  const [branchId, setBranchId] = useState("");

  const ownerBranchesQuery = useOwnerBranchListQuery(
    { pageNumber: 1, pageSize: 100, sortBy: "name", sortDirection: "asc" },
    portal === "owner"
  );
  const managerBranchesQuery = useMyBranchesListQuery(portal === "manager");

  const branches: BranchResponse[] = useMemo(() => {
    return portal === "owner"
      ? (ownerBranchesQuery.data?.items ?? [])
      : (managerBranchesQuery.data ?? []);
  }, [managerBranchesQuery.data, ownerBranchesQuery.data?.items, portal]);

  useEffect(() => {
    if (!branchId && branches.length > 0) {
      setBranchId(branches[0].branchId);
    }
  }, [branchId, branches]);

  const paymentConfigQuery = useBranchPaymentConfigQuery(portal, branchId, Boolean(branchId));
  const vouchersQuery = usePaperVouchersQuery(portal, branchId, Boolean(branchId));
  const savePaymentMutation = useUpsertBranchPaymentConfigMutation();
  const createVoucherMutation = useCreatePaperVoucherMutation();

  const {
    register: registerPayment,
    handleSubmit: handleSubmitPayment,
    reset: resetPayment,
    watch: watchPayment,
    setValue: setValuePayment,
  } = useForm<UpsertBranchPaymentConfigRequest>({
    defaultValues: {
      cashEnabled: true,
      payOsEnabled: false,
      payOsClientId: "",
      payOsApiKey: "",
      payOsChecksumKey: "",
      defaultMethod: "CASH",
    },
  });

  const {
    register: registerVoucher,
    handleSubmit: handleSubmitVoucher,
    reset: resetVoucher,
  } = useForm<PaperVoucherRequest>({
    defaultValues: emptyVoucher,
  });

  const payOsEnabled = watchPayment("payOsEnabled");

  useEffect(() => {
    if (!payOsEnabled) {
      setValuePayment("defaultMethod", "CASH");
    }
  }, [payOsEnabled, setValuePayment]);

  useEffect(() => {
    const config = paymentConfigQuery.data;
    if (!config) return;

    resetPayment({
      cashEnabled: true,
      payOsEnabled: config.payOsEnabled,
      payOsClientId: "",
      payOsApiKey: "",
      payOsChecksumKey: "",
      defaultMethod: config.defaultMethod,
    });
  }, [paymentConfigQuery.data, resetPayment]);

  const vouchers = vouchersQuery.data ?? [];
  const activeVouchers = vouchers.filter((voucher) => voucher.isActive).length;

  const savePaymentConfig = async (values: UpsertBranchPaymentConfigRequest) => {
    if (!branchId) return;

    await savePaymentMutation.mutateAsync({
      portal,
      branchId,
      data: {
        ...values,
        cashEnabled: true,
        defaultMethod: values.payOsEnabled ? values.defaultMethod : "CASH",
      },
    });
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEY.BRANCH_PAYMENT_CONFIG, portal, branchId],
    });
    showNotify({ type: "success", message: "Đã lưu cấu hình thanh toán." });
  };

  const createVoucher = async (values: PaperVoucherRequest) => {
    if (!branchId) return;

    const payload = toVoucherPayload({
      ...values,
      discountValue: Number(values.discountValue || 0),
      minOrderAmount: Number(values.minOrderAmount || 0),
      maxDiscountAmount: values.maxDiscountAmount ? Number(values.maxDiscountAmount) : null,
      quantity: Number(values.quantity || 1),
    });

    await createVoucherMutation.mutateAsync({ portal, branchId, data: payload });
    resetVoucher(emptyVoucher);
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.PAPER_VOUCHERS, portal, branchId] });
    showNotify({ type: "success", message: "Đã tạo voucher giấy." });
  };

  return (
    <PortalShell
      title="Cài đặt chi nhánh"
      description="Cấu hình thanh toán và voucher giấy cho từng chi nhánh."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getManageMenuNavItems(portal, "settings")}
      topbarTitle={currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      stats={
        <>
          <PortalStatCard
            label="Chi nhánh"
            value={String(branches.length)}
            helper="Có thể cấu hình"
          />
          <PortalStatCard label="Tiền mặt" value="Đang bật" helper="Phương thức mặc định" />
          <PortalStatCard
            label="PayOS"
            value={paymentConfigQuery.data?.payOsEnabled ? "Đang bật" : "Đang tắt"}
            helper="Thanh toán QR theo chi nhánh"
          />
          <PortalStatCard
            label="Phiếu giảm giá"
            value={String(activeVouchers)}
            helper="Voucher giấy đang hoạt động"
          />
        </>
      }
    >
      <section className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="branch-select" required>
            Chi nhánh
          </Label>
          <select
            id="branch-select"
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
            className="border-input bg-card mt-2 h-10 w-full max-w-lg rounded-lg border px-3 text-sm outline-none"
          >
            <option value="">Chọn chi nhánh</option>
            {branches.map((branch) => (
              <option key={branch.branchId} value={branch.branchId}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {paymentConfigQuery.isLoading || vouchersQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Đang tải cài đặt...</span>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="text-primary size-5" />
            <h2 className="text-xl font-bold">Cấu hình thanh toán</h2>
          </div>
          <form onSubmit={handleSubmitPayment(savePaymentConfig)} className="mt-5 space-y-4">
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input type="checkbox" {...registerPayment("payOsEnabled")} />
              Bật PayOS cho chi nhánh này
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Mã khách hàng PayOS
                <Input {...registerPayment("payOsClientId")} className="mt-2 h-10" />
                {paymentConfigQuery.data?.hasPayOsClientId ? (
                  <span className="text-muted-foreground mt-1 block text-xs font-medium">
                    Đã cấu hình ({paymentConfigQuery.data.payOsClientIdPreview ?? "đã lưu"}) - để
                    trống nếu muốn giữ Client ID hiện tại.
                  </span>
                ) : (
                  <span className="text-muted-foreground mt-1 block text-xs font-medium">
                    Bắt buộc khi bật PayOS.
                  </span>
                )}
              </label>

              <label className="text-sm font-semibold">
                Khóa API PayOS
                <Input type="password" {...registerPayment("payOsApiKey")} className="mt-2 h-10" />
                {paymentConfigQuery.data?.hasPayOsApiKey ? (
                  <span className="text-muted-foreground mt-1 block text-xs font-medium">
                    Đã cấu hình - để trống nếu muốn giữ key hiện tại.
                  </span>
                ) : (
                  <span className="text-muted-foreground mt-1 block text-xs font-medium">
                    Bắt buộc khi bật PayOS.
                  </span>
                )}
              </label>

              <label className="text-sm font-semibold">
                Khóa kiểm tra PayOS
                <Input
                  type="password"
                  {...registerPayment("payOsChecksumKey")}
                  className="mt-2 h-10"
                />
                {paymentConfigQuery.data?.hasPayOsChecksumKey ? (
                  <span className="text-muted-foreground mt-1 block text-xs font-medium">
                    Đã cấu hình - để trống nếu muốn giữ key hiện tại.
                  </span>
                ) : (
                  <span className="text-muted-foreground mt-1 block text-xs font-medium">
                    Bắt buộc khi bật PayOS.
                  </span>
                )}
              </label>

              <label className="text-sm font-semibold">
                Phương thức mặc định
                <select
                  {...registerPayment("defaultMethod")}
                  className="border-input bg-card mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none"
                >
                  <option value="CASH">Tiền mặt</option>
                  <option value="PAYOS" disabled={!payOsEnabled}>
                    PayOS
                  </option>
                </select>
              </label>
            </div>

            <Button type="submit" disabled={!branchId || savePaymentMutation.isPending}>
              <Save className="size-4" />
              Lưu cấu hình
            </Button>
          </form>
        </div>

        <div className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Gift className="text-primary size-5" />
            <h2 className="text-xl font-bold">Tạo voucher giấy</h2>
          </div>
          <form onSubmit={handleSubmitVoucher(createVoucher)}>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Mã voucher
                <Input {...registerVoucher("code")} className="mt-2 h-10" />
              </label>
              <label className="text-sm font-semibold">
                Tên voucher
                <Input {...registerVoucher("name")} className="mt-2 h-10" />
              </label>
              <label className="text-sm font-semibold">
                Loại giảm giá
                <select
                  {...registerVoucher("discountType")}
                  className="border-input bg-card mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none"
                >
                  <option value="PERCENT">Theo phần trăm</option>
                  <option value="FIXED_AMOUNT">Số tiền cố định</option>
                </select>
              </label>
              <label className="text-sm font-semibold">
                Giá trị giảm
                <Input type="number" {...registerVoucher("discountValue")} className="mt-2 h-10" />
              </label>
              <label className="text-sm font-semibold">
                Đơn tối thiểu
                <Input type="number" {...registerVoucher("minOrderAmount")} className="mt-2 h-10" />
              </label>
              <label className="text-sm font-semibold">
                Giảm tối đa
                <Input
                  type="number"
                  {...registerVoucher("maxDiscountAmount")}
                  className="mt-2 h-10"
                />
              </label>
              <label className="text-sm font-semibold">
                Số lượng
                <Input type="number" {...registerVoucher("quantity")} className="mt-2 h-10" />
              </label>
              <label className="text-sm font-semibold">
                Mô tả
                <Input {...registerVoucher("description")} className="mt-2 h-10" />
              </label>
              <label className="text-sm font-semibold">
                Ngày bắt đầu
                <Input type="date" {...registerVoucher("validFrom")} className="mt-2 h-10" />
                <span className="text-muted-foreground mt-1 block text-xs font-medium">
                  Voucher có hiệu lực từ 00:00 của ngày được chọn.
                </span>
              </label>
              <label className="text-sm font-semibold">
                Ngày kết thúc
                <Input type="date" {...registerVoucher("validUntil")} className="mt-2 h-10" />
                <span className="text-muted-foreground mt-1 block text-xs font-medium">
                  Voucher hết hạn lúc 23:59:59 của ngày này.
                </span>
              </label>
            </div>
            <Button
              className="mt-4"
              type="submit"
              disabled={!branchId || createVoucherMutation.isPending}
            >
              <Gift className="size-4" />
              Tạo voucher
            </Button>
          </form>
        </div>
      </section>

      <section className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Danh sách voucher giấy</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Theo dõi thời hạn, số lượt dùng và mã QR dùng để in/phát cho khách.
            </p>
          </div>
          <Button
            variant="soft"
            onClick={() => vouchersQuery.refetch()}
            disabled={vouchersQuery.isFetching}
          >
            <RefreshCw className={cn("size-4", vouchersQuery.isFetching && "animate-spin")} />
            Làm mới
          </Button>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {vouchers.length === 0 ? (
            <div className="border-border/60 bg-muted/20 rounded-xl border border-dashed p-8 text-center">
              <TicketPercent className="text-muted-foreground mx-auto size-8" />
              <p className="mt-3 text-sm font-semibold">Chưa có voucher giấy</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Tạo voucher đầu tiên để áp dụng cho đơn hàng tại quầy.
              </p>
            </div>
          ) : (
            vouchers.map((voucher) => {
              const usedPercent =
                voucher.quantity > 0
                  ? Math.min(100, Math.round((voucher.usedCount / voucher.quantity) * 100))
                  : 0;

              return (
                <article
                  key={voucher.voucherId}
                  className="border-border/60 hover:border-primary/30 hover:bg-muted/20 rounded-xl border p-4 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-md px-2.5 py-1 font-mono text-sm font-black tracking-wide">
                          {voucher.code}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-bold",
                            voucher.isActive
                              ? "bg-success text-success-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {voucher.isActive ? "Đang hoạt động" : "Tạm tắt"}
                        </span>
                      </div>
                      <p className="text-foreground mt-3 truncate text-base font-bold">
                        {voucher.name}
                      </p>
                      {voucher.description ? (
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                          {voucher.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black">{formatVoucherDiscount(voucher)}</p>
                      <p className="text-muted-foreground text-xs font-semibold">
                        {voucher.discountType === "PERCENT" ? "Giảm theo %" : "Giảm cố định"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <VoucherMetric
                      icon={<WalletCards className="size-4" />}
                      label="Đơn tối thiểu"
                      value={formatCurrency(voucher.minOrderAmount)}
                    />
                    <VoucherMetric
                      icon={<Gift className="size-4" />}
                      label="Giảm tối đa"
                      value={
                        voucher.maxDiscountAmount
                          ? formatCurrency(voucher.maxDiscountAmount)
                          : "Không giới hạn"
                      }
                    />
                    <VoucherMetric
                      icon={<Clock3 className="size-4" />}
                      label="Còn lại"
                      value={`${voucher.remainingCount}/${voucher.quantity}`}
                    />
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">
                        Đã dùng {voucher.usedCount} lượt
                      </span>
                      <span>{usedPercent}%</span>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${usedPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="border-border/60 mt-4 grid gap-3 border-t pt-4 text-sm md:grid-cols-[1fr_1.2fr]">
                    <div className="text-muted-foreground flex items-center gap-2">
                      <CalendarDays className="size-4" />
                      <span>
                        {formatDate(voucher.validFrom)} - {formatDate(voucher.validUntil)}
                      </span>
                    </div>
                    <div className="text-muted-foreground flex min-w-0 items-center gap-2">
                      <QrCode className="size-4 shrink-0" />
                      <span className="truncate font-mono text-xs">{voucher.qrPayload}</span>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </PortalShell>
  );
};

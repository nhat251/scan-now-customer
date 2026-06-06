"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Gift, RefreshCw, Save } from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { formatCurrency, getManageMenuNavItems, getPortalCopy, type ManagePortal } from "@/components/manage-menu/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { QUERY_KEY } from "@/constants/queryKeys";
import { useCreatePaperVoucherMutation, useUpsertBranchPaymentConfigMutation } from "@/hooks/mutations/useBranchSettingsMutations";
import { useBranchPaymentConfigQuery, usePaperVouchersQuery } from "@/hooks/queries/useBranchSettingsQueries";
import { useMyBranchesListQuery } from "@/hooks/queries/useMeQueries";
import { useOwnerBranchListQuery } from "@/hooks/queries/useOwnerBranchListQuery";
import { cn } from "@/lib/utils";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type { DiscountType, PaperVoucherRequest, PaymentMethod, UpsertBranchPaymentConfigRequest } from "@/types/branch-settings";
import type { BranchResponse } from "@/types/user-management";
import { useQueryClient } from "@tanstack/react-query";

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

export const BranchSettingsPage = ({ portal }: BranchSettingsPageProps) => {
  const queryClient = useQueryClient();
  const currentUser = useUserStore((state) => state.user);
  const copy = getPortalCopy(portal);
  const [branchId, setBranchId] = useState("");
  const [paymentForm, setPaymentForm] = useState<UpsertBranchPaymentConfigRequest>({
    cashEnabled: true,
    payOsEnabled: false,
    payOsClientId: "",
    payOsApiKey: "",
    payOsChecksumKey: "",
    defaultMethod: "CASH",
  });
  const [voucherForm, setVoucherForm] = useState<PaperVoucherRequest>(emptyVoucher);

  const ownerBranchesQuery = useOwnerBranchListQuery(
    { pageNumber: 1, pageSize: 100, sortBy: "name", sortDirection: "asc" },
    portal === "owner"
  );
  const managerBranchesQuery = useMyBranchesListQuery(portal === "manager");

  const branches: BranchResponse[] = useMemo(() => {
    return portal === "owner" ? ownerBranchesQuery.data?.items ?? [] : managerBranchesQuery.data ?? [];
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

  useEffect(() => {
    const config = paymentConfigQuery.data;
    if (!config) return;

    setPaymentForm({
      cashEnabled: true,
      payOsEnabled: config.payOsEnabled,
      payOsClientId: "",
      payOsApiKey: "",
      payOsChecksumKey: "",
      defaultMethod: config.defaultMethod,
    });
  }, [paymentConfigQuery.data]);

  const vouchers = vouchersQuery.data ?? [];
  const activeVouchers = vouchers.filter((voucher) => voucher.isActive).length;

  const savePaymentConfig = async () => {
    if (!branchId) return;

    await savePaymentMutation.mutateAsync({
      portal,
      branchId,
      data: {
        ...paymentForm,
        cashEnabled: true,
        defaultMethod: paymentForm.payOsEnabled ? paymentForm.defaultMethod : "CASH",
      },
    });
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.BRANCH_PAYMENT_CONFIG, portal, branchId] });
    showNotify({ type: "success", message: "Payment config saved." });
  };

  const createVoucher = async () => {
    if (!branchId) return;

    await createVoucherMutation.mutateAsync({ portal, branchId, data: voucherForm });
    setVoucherForm(emptyVoucher);
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.PAPER_VOUCHERS, portal, branchId] });
    showNotify({ type: "success", message: "Paper voucher created." });
  };

  return (
    <PortalShell
      title="Branch Settings"
      description="Configure branch payment methods and paper vouchers."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getManageMenuNavItems(portal, "settings")}
      topbarTitle={currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      stats={
        <>
          <PortalStatCard label="Branches" value={String(branches.length)} helper="Available to configure" />
          <PortalStatCard label="Cash" value="Enabled" helper="Default fallback payment" />
          <PortalStatCard label="PayOS" value={paymentConfigQuery.data?.payOsEnabled ? "Enabled" : "Off"} helper="Branch QR payment" />
          <PortalStatCard label="Vouchers" value={String(activeVouchers)} helper="Active paper vouchers" />
        </>
      }
    >
      <section className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
        <label className="text-sm font-semibold">
          Branch
          <select
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
            className="border-input bg-card mt-2 h-10 w-full max-w-lg rounded-lg border px-3 text-sm outline-none"
          >
            <option value="">Select branch</option>
            {branches.map((branch) => (
              <option key={branch.branchId} value={branch.branchId}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {paymentConfigQuery.isLoading || vouchersQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Loading settings...</span>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="text-primary size-5" />
            <h2 className="text-xl font-bold">Payment Config</h2>
          </div>
          <div className="mt-5 space-y-4">
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={paymentForm.payOsEnabled}
                onChange={(event) => setPaymentForm((current) => ({
                  ...current,
                  payOsEnabled: event.target.checked,
                  defaultMethod: event.target.checked ? current.defaultMethod : "CASH",
                }))}
              />
              Enable PayOS for this branch
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="PayOS Client ID"
                value={paymentForm.payOsClientId ?? ""}
                onChange={(value) => setPaymentForm((current) => ({ ...current, payOsClientId: value }))}
                helper={paymentConfigQuery.data?.hasPayOsClientId ? `Configured (${paymentConfigQuery.data.payOsClientIdPreview ?? "saved"}) - leave blank to keep current Client ID.` : "Required when enabling PayOS."}
              />
              <TextField
                label="PayOS API Key"
                value={paymentForm.payOsApiKey ?? ""}
                onChange={(value) => setPaymentForm((current) => ({ ...current, payOsApiKey: value }))}
                type="password"
                helper={paymentConfigQuery.data?.hasPayOsApiKey ? "Configured - leave blank to keep current key." : "Required when enabling PayOS."}
              />
              <TextField
                label="Checksum Key"
                value={paymentForm.payOsChecksumKey ?? ""}
                onChange={(value) => setPaymentForm((current) => ({ ...current, payOsChecksumKey: value }))}
                type="password"
                helper={paymentConfigQuery.data?.hasPayOsChecksumKey ? "Configured - leave blank to keep current key." : "Required when enabling PayOS."}
              />
              <label className="text-sm font-semibold">
                Default Method
                <select
                  value={paymentForm.defaultMethod}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, defaultMethod: event.target.value as PaymentMethod }))}
                  className="border-input bg-card mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="PAYOS" disabled={!paymentForm.payOsEnabled}>PayOS</option>
                </select>
              </label>
            </div>

            <Button onClick={savePaymentConfig} disabled={!branchId || savePaymentMutation.isPending}>
              <Save className="size-4" />
              Save payment config
            </Button>
          </div>
        </div>

        <div className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Gift className="text-primary size-5" />
            <h2 className="text-xl font-bold">Create Paper Voucher</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <TextField label="Code" value={voucherForm.code} onChange={(value) => setVoucherForm((current) => ({ ...current, code: value }))} />
            <TextField label="Name" value={voucherForm.name} onChange={(value) => setVoucherForm((current) => ({ ...current, name: value }))} />
            <label className="text-sm font-semibold">
              Discount Type
              <select
                value={voucherForm.discountType}
                onChange={(event) => setVoucherForm((current) => ({ ...current, discountType: event.target.value as DiscountType }))}
                className="border-input bg-card mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none"
              >
                <option value="PERCENT">Percent</option>
                <option value="FIXED_AMOUNT">Fixed amount</option>
              </select>
            </label>
            <NumberField label="Discount Value" value={voucherForm.discountValue} onChange={(value) => setVoucherForm((current) => ({ ...current, discountValue: value }))} />
            <NumberField label="Min Order" value={voucherForm.minOrderAmount} onChange={(value) => setVoucherForm((current) => ({ ...current, minOrderAmount: value }))} />
            <NumberField label="Max Discount" value={voucherForm.maxDiscountAmount ?? 0} onChange={(value) => setVoucherForm((current) => ({ ...current, maxDiscountAmount: value || null }))} />
            <NumberField label="Quantity" value={voucherForm.quantity} onChange={(value) => setVoucherForm((current) => ({ ...current, quantity: value }))} />
            <TextField label="Description" value={voucherForm.description ?? ""} onChange={(value) => setVoucherForm((current) => ({ ...current, description: value }))} />
            <TextField label="Valid From" value={voucherForm.validFrom ?? ""} onChange={(value) => setVoucherForm((current) => ({ ...current, validFrom: value || null }))} type="date" />
            <TextField label="Valid Until" value={voucherForm.validUntil ?? ""} onChange={(value) => setVoucherForm((current) => ({ ...current, validUntil: value || null }))} type="date" />
          </div>
          <Button className="mt-4" onClick={createVoucher} disabled={!branchId || createVoucherMutation.isPending}>
            <Gift className="size-4" />
            Create voucher
          </Button>
        </div>
      </section>

      <section className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Paper Vouchers</h2>
          <Button variant="soft" onClick={() => vouchersQuery.refetch()} disabled={vouchersQuery.isFetching}>
            <RefreshCw className={cn("size-4", vouchersQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {vouchers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No paper voucher created yet.</p>
          ) : (
            vouchers.map((voucher) => (
              <article key={voucher.voucherId} className="border-border/60 rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black">{voucher.code}</p>
                    <p className="text-muted-foreground text-sm">{voucher.name}</p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", voucher.isActive ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
                    {voucher.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <p><span className="text-muted-foreground">Discount:</span> {voucher.discountType === "PERCENT" ? `${voucher.discountValue}%` : formatCurrency(voucher.discountValue)}</p>
                  <p><span className="text-muted-foreground">Used:</span> {voucher.usedCount}/{voucher.quantity}</p>
                  <p><span className="text-muted-foreground">Min:</span> {formatCurrency(voucher.minOrderAmount)}</p>
                  <p><span className="text-muted-foreground">QR:</span> {voucher.qrPayload}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </PortalShell>
  );
};

const TextField = ({
  label,
  value,
  onChange,
  type = "text",
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  helper?: string;
}) => (
  <label className="text-sm font-semibold">
    {label}
    <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10" />
    {helper ? <span className="text-muted-foreground mt-1 block text-xs font-medium">{helper}</span> : null}
  </label>
);

const NumberField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => (
  <label className="text-sm font-semibold">
    {label}
    <Input
      type="number"
      value={String(value)}
      onChange={(event) => onChange(Number(event.target.value || 0))}
      className="mt-2 h-10"
    />
  </label>
);

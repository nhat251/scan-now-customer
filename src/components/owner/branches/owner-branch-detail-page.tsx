"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Soup, Table2, Tags } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { getManageMenuNavItems } from "@/components/manage-menu/helpers";
import {
  getBranchStatusLabel,
  getDefaultOwnerBranchFormValues,
  getOwnerBranchErrorState,
  toOwnerBranchFormValues,
} from "@/components/owner/branches/helpers";
import { OwnerBranchForm } from "@/components/owner/branches/owner-branch-form";
import { getOwnerPortalNavItems } from "@/components/owner/users/owner-portal-nav";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { useCreateOwnerBranchMutation, useUpdateOwnerBranchMutation } from "@/hooks/mutations/useOwnerBranchMutations";
import { useOwnerBranchDetailQuery } from "@/hooks/queries/useOwnerBranchDetailQuery";
import { useUserStore } from "@/stores/user";
import type { CreateBranchRequest, OwnerBranchFormValues, UpdateBranchRequest } from "@/types/user-management";
import { zodResolver } from "@hookform/resolvers/zod";

type OwnerBranchDetailPageProps = {
  branchId?: string;
  mode: "create" | "edit";
};

const toBranchPayload = (value: OwnerBranchFormValues): CreateBranchRequest | UpdateBranchRequest => ({
  name: value.name.trim(),
  slug: value.slug.trim(),
  address: value.address.trim() || null,
  phone: value.phone.trim() || null,
  email: value.email.trim() || null,
  openTime: value.openTime || null,
  closeTime: value.closeTime || null,
  vatPercent: value.vatPercent ? Number(value.vatPercent) : undefined,
  serviceChargePercent: value.serviceChargePercent ? Number(value.serviceChargePercent) : undefined,
  serviceChargeFixed: value.serviceChargeFixed ? Number(value.serviceChargeFixed) : undefined,
});

const ownerBranchSchema = z.object({
  name: z.string().trim().min(1, "Tên chi nhánh là bắt buộc."),
  slug: z.string().trim().min(1, "Slug là bắt buộc."),
  email: z.string().refine(
    (val) => !val || val.includes("@"),
    { message: "Email không hợp lệ." }
  ),
  phone: z.string(),
  address: z.string(),
  openTime: z.string(),
  closeTime: z.string(),
  vatPercent: z.string(),
  serviceChargePercent: z.string(),
  serviceChargeFixed: z.string(),
});

export const OwnerBranchDetailPage = ({ branchId, mode }: OwnerBranchDetailPageProps) => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const detailQuery = useOwnerBranchDetailQuery(branchId);
  const createMutation = useCreateOwnerBranchMutation();
  const updateMutation = useUpdateOwnerBranchMutation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OwnerBranchFormValues>({
    resolver: zodResolver(ownerBranchSchema),
    defaultValues: getDefaultOwnerBranchFormValues(),
  });

  useEffect(() => {
    if (mode === "edit" && detailQuery.data) {
      reset(toOwnerBranchFormValues(detailQuery.data));
    }
  }, [detailQuery.data, mode, reset]);

  const submitForm = async (values: OwnerBranchFormValues) => {
    const payload = toBranchPayload(values);

    if (mode === "create") {
      await createMutation.mutateAsync(payload);
      router.push(PATH.owner.branches);
      return;
    }

    if (!branchId) {
      return;
    }

    await updateMutation.mutateAsync({ id: branchId, data: payload });
  };

  if (mode === "edit" && detailQuery.isError) {
    const errorState = getOwnerBranchErrorState(detailQuery.error);

    return (
      <PortalShell
        title="Chi tiết chi nhánh"
        description="Xem và cập nhật thông tin chi nhánh."
        portalLabel="Bộ quản lý"
        portalName="Cổng chủ quán"
        navItems={getOwnerPortalNavItems("branches")}
        topbarTitle={currentUser?.fullName ?? "Cổng chủ quán"}
        currentUser={currentUser}
      >
        <div className="border-border/60 bg-card rounded-[1.5rem] border p-8 shadow-sm">
          <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">Cổng chủ quán</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">{errorState.heading}</h2>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">{errorState.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => detailQuery.refetch()} disabled={detailQuery.isRefetching}>
              {errorState.retryLabel}
            </Button>
            {errorState.shouldRouteToLogin ? (
              <Button variant="outline" onClick={() => router.push(PATH.auth.login)}>
                Về trang đăng nhập
              </Button>
            ) : null}
          </div>
        </div>
      </PortalShell>
    );
  }

  const branch = detailQuery.data;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <PortalShell
      title={mode === "create" ? "Tạo chi nhánh" : branch?.name ?? "Chi tiết chi nhánh"}
      description={mode === "create" ? "Tạo chi nhánh mới cho nhà hàng." : "Xem và cập nhật thông tin, liên hệ, giờ mở cửa và phí của chi nhánh."}
      portalLabel="Bộ quản lý"
      portalName="Cổng chủ quán"
      navItems={branchId ? getManageMenuNavItems("owner", "branches", branchId) : getOwnerPortalNavItems("branches")}
      topbarTitle={branch?.name ?? currentUser?.fullName ?? "Cổng chủ quán"}
      currentUser={currentUser}
      branchName={branch?.name}
      branchId={branchId}
      headerAction={
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => router.push(PATH.owner.branches)}>
            Quay lại chi nhánh
          </Button>
          {branchId ? (
            <>
              <Button variant="outline" onClick={() => router.push(PATH.owner.branchCategories(branchId))}>
                <Tags className="size-4" />
                Danh mục
              </Button>
              <Button onClick={() => router.push(PATH.owner.branchMenuItems(branchId))}>
                <Soup className="size-4" />
                Món ăn
              </Button>
              <Button variant="outline" onClick={() => router.push(PATH.owner.branchTables(branchId))}>
                <Table2 className="size-4" />
                Sơ đồ bàn & QR
              </Button>
            </>
          ) : null}
        </div>
      }
      stats={
        mode === "edit" ? (
          <>
            <PortalStatCard label="Chi nhánh" value={branch?.name ?? "-"} helper={branch?.slug ? `/${branch.slug}` : "Chưa có slug"} />
            <PortalStatCard label="Trạng thái" value={branch ? getBranchStatusLabel(branch) : "-"} helper={branch?.managerName ?? "Chưa gán quản lý"} />
            <PortalStatCard
              label="Liên hệ"
              value={branch?.email ?? "-"}
              helper={branch?.phone ?? "Chưa có số điện thoại"}
              valueClassName="break-all text-2xl xl:text-3xl"
            />
            <PortalStatCard label="Giờ mở cửa" value={branch?.openTime ?? "-"} helper={branch?.closeTime ?? "Chưa có giờ đóng cửa"} />
          </>
        ) : undefined
      }
    >
      <OwnerBranchForm mode={mode} register={register} errors={errors} submitting={isSubmitting} onSubmit={handleSubmit(submitForm)} />
    </PortalShell>
  );
};

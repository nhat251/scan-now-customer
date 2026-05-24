"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Soup, Table2, Tags } from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
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

export const OwnerBranchDetailPage = ({ branchId, mode }: OwnerBranchDetailPageProps) => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const detailQuery = useOwnerBranchDetailQuery(branchId);
  const createMutation = useCreateOwnerBranchMutation();
  const updateMutation = useUpdateOwnerBranchMutation();
  const [value, setValue] = useState<OwnerBranchFormValues>(getDefaultOwnerBranchFormValues());
  const [errors, setErrors] = useState<Partial<Record<keyof OwnerBranchFormValues, string>>>({});

  useEffect(() => {
    if (mode === "edit" && detailQuery.data) {
      setValue(toOwnerBranchFormValues(detailQuery.data));
    }
  }, [detailQuery.data, mode]);

  const onChange = <Key extends keyof OwnerBranchFormValues>(key: Key, nextValue: OwnerBranchFormValues[Key]) => {
    setValue((current) => ({ ...current, [key]: nextValue }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof OwnerBranchFormValues, string>> = {};

    if (!value.name.trim()) nextErrors.name = "Branch name is required.";
    if (!value.slug.trim()) nextErrors.slug = "Slug is required.";
    if (value.email && !value.email.includes("@")) nextErrors.email = "Enter a valid email address.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitForm = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = toBranchPayload(value);

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
        title="Branch Detail"
        description="Review and update branch information."
        portalLabel="Management Suite"
        portalName="Owner Portal"
        navItems={getOwnerPortalNavItems("branches")}
        topbarTitle={currentUser?.fullName ?? "Owner Portal"}
        currentUser={currentUser}
      >
        <div className="border-border/60 bg-card rounded-[1.5rem] border p-8 shadow-sm">
          <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">Owner portal</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">{errorState.heading}</h2>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">{errorState.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => detailQuery.refetch()} disabled={detailQuery.isRefetching}>
              {errorState.retryLabel}
            </Button>
            {errorState.shouldRouteToLogin ? (
              <Button variant="outline" onClick={() => router.push(PATH.auth.login)}>
                Go to login
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
      title={mode === "create" ? "Create Branch" : branch?.name ?? "Branch Detail"}
      description={mode === "create" ? "Create a new branch for your restaurant." : "Review and update branch information, contact details, and fees."}
      portalLabel="Management Suite"
      portalName="Owner Portal"
      navItems={getOwnerPortalNavItems("branches")}
      topbarTitle={branch?.name ?? currentUser?.fullName ?? "Owner Portal"}
      currentUser={currentUser}
      headerAction={
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => router.push(PATH.owner.branches)}>
            Back to branches
          </Button>
          {branchId ? (
            <>
              <Button variant="outline" onClick={() => router.push(PATH.owner.branchCategories(branchId))}>
                <Tags className="size-4" />
                Categories
              </Button>
              <Button onClick={() => router.push(PATH.owner.branchMenuItems(branchId))}>
                <Soup className="size-4" />
                Menu Items
              </Button>
              <Button variant="outline" onClick={() => router.push(PATH.owner.branchTables(branchId))}>
                <Table2 className="size-4" />
                Tables & QR
              </Button>
            </>
          ) : null}
        </div>
      }
      stats={
        mode === "edit" ? (
          <>
            <PortalStatCard label="Branch" value={branch?.name ?? "-"} helper={branch?.slug ? `/${branch.slug}` : "Slug pending"} />
            <PortalStatCard label="Status" value={branch ? getBranchStatusLabel(branch) : "-"} helper={branch?.managerName ?? "No manager assigned"} />
            <PortalStatCard
              label="Contact"
              value={branch?.email ?? "-"}
              helper={branch?.phone ?? "No phone on file"}
              valueClassName="break-all text-2xl xl:text-3xl"
            />
            <PortalStatCard label="Hours" value={branch?.openTime ?? "-"} helper={branch?.closeTime ?? "No closing time"} />
          </>
        ) : undefined
      }
    >
      <OwnerBranchForm mode={mode} value={value} errors={errors} submitting={isSubmitting} onChange={onChange} onSubmit={submitForm} />
    </PortalShell>
  );
};

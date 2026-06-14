"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import type { ManagePortal } from "@/components/manage-menu/helpers";
import {
  getReportDerivedMetrics,
  getReportPresetRange,
  getReportRevenueSeries,
} from "@/components/reports/report-dashboard.helpers";
import type { PeriodPreset } from "@/components/reports/report-dashboard.types";
import { exportRevenueWorkbook } from "@/components/reports/report-export.helpers";
import { useMyBranchesListQuery } from "@/hooks/queries/useMeQueries";
import { useOwnerBranchListQuery } from "@/hooks/queries/useOwnerBranchListQuery";
import { useReportOverviewQuery } from "@/hooks/queries/useReportQueries";
import { useUserStore } from "@/stores/user";
import type { BranchResponse } from "@/types/user-management";

export const useReportDashboard = (portal: ManagePortal) => {
  const currentUser = useUserStore((state) => state.user);
  const defaultRange = useMemo(() => getReportPresetRange("month"), []);
  const { register, control, setValue } = useForm({
    defaultValues: {
      periodPreset: "month" as PeriodPreset,
      fromDate: defaultRange.fromDate,
      toDate: defaultRange.toDate,
      branchId: "",
    },
  });

  const periodPreset = useWatch({ control, name: "periodPreset" });
  const fromDate = useWatch({ control, name: "fromDate" });
  const toDate = useWatch({ control, name: "toDate" });
  const branchId = useWatch({ control, name: "branchId" });

  const ownerBranchesQuery = useOwnerBranchListQuery(
    { pageNumber: 1, pageSize: 100, sortBy: "name", sortDirection: "asc" },
    portal === "owner"
  );
  const managerBranchesQuery = useMyBranchesListQuery(portal === "manager");
  const branches: BranchResponse[] = useMemo(
    () =>
      portal === "owner"
        ? (ownerBranchesQuery.data?.items ?? [])
        : (managerBranchesQuery.data ?? []),
    [managerBranchesQuery.data, ownerBranchesQuery.data?.items, portal]
  );

  const reportQuery = useReportOverviewQuery(portal, {
    branchId: branchId || undefined,
    fromDate,
    toDate,
  });
  const report = reportQuery.data;
  const metrics = getReportDerivedMetrics(report);
  const revenueSeries = report
    ? getReportRevenueSeries({
        preset: periodPreset,
        fromDate,
        toDate,
        revenueByDay: report.revenueByDay,
        peakHours: report.peakHours,
      })
    : null;

  const setPreset = (preset: Exclude<PeriodPreset, "custom">) => {
    const range = getReportPresetRange(preset);
    setValue("periodPreset", preset);
    setValue("fromDate", range.fromDate);
    setValue("toDate", range.toDate);
  };

  const exportRevenueReport = async () => {
    if (!report || !revenueSeries) {
      return;
    }

    const selectedBranch =
      branches.find((branch) => branch.branchId === branchId)?.name ?? "Tất cả chi nhánh";
    await exportRevenueWorkbook({
      report,
      revenueSeries,
      selectedBranch,
      fromDate,
      toDate,
      metrics: {
        completionRate: metrics.completionRate,
        paidRevenueRate: metrics.paidRevenueRate,
        pendingOrders: metrics.pendingOrders,
      },
    });
  };

  return {
    branchId,
    branches,
    currentUser,
    exportRevenueReport,
    fromDate,
    metrics,
    periodPreset,
    refetchReport: reportQuery.refetch,
    register,
    report,
    reportQuery,
    revenueSeries,
    setPreset,
    setValue,
    toDate,
  };
};

import { axiosBasic } from "@/services/axiosBasic";
import type { ApiResponse } from "@/types/api";
import type { OwnerReportResponse, ReportQuery } from "@/types/reports";

export const getReportOverview = async (portal: "owner" | "manager", query: ReportQuery) => {
  return await axiosBasic.get<ApiResponse<OwnerReportResponse>>(`/api/${portal}/reports/overview`, {
    params: query,
  });
};

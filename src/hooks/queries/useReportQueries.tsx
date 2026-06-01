import { QUERY_KEY } from "@/constants/queryKeys";
import useQuery from "@/hooks/useQuery";
import { getReportOverview } from "@/services/reports";
import type { ApiResponse } from "@/types/api";
import type { OwnerReportResponse, ReportQuery } from "@/types/reports";
import type { UseQueryResult } from "@tanstack/react-query";

export const useReportOverviewQuery = (
  portal: "owner" | "manager",
  query: ReportQuery
): UseQueryResult<OwnerReportResponse, Error> => {
  return useQuery<ApiResponse<OwnerReportResponse>, OwnerReportResponse>({
    queryKey: [
      QUERY_KEY.REPORT_OVERVIEW,
      portal,
      query.branchId ?? "",
      query.fromDate ?? "",
      query.toDate ?? "",
    ],
    queryFn: () => getReportOverview(portal, query),
    select: (res) => res.data.result,
  });
};

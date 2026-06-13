import { ProtectedRoute } from "@/components/auth/protected-route";
import { OwnerTableDetailPage } from "@/components/owner/tables/owner-table-detail-page";

type ManagerBranchTableDetailRouteProps = {
  params: Promise<{
    branchId: string;
    tableId: string;
  }>;
};

const ManagerBranchTableDetailRoute = async ({ params }: ManagerBranchTableDetailRouteProps) => {
  const { branchId, tableId } = await params;

  return (
    <ProtectedRoute allowedRoles={["BRANCH_MANAGER"]}>
      <OwnerTableDetailPage branchId={branchId} tableId={tableId} portal="manager" />
    </ProtectedRoute>
  );
};

export default ManagerBranchTableDetailRoute;

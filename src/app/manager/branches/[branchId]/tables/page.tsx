import { ProtectedRoute } from "@/components/auth/protected-route";
import { OwnerTableListPage } from "@/components/owner/tables/owner-table-list-page";

type ManagerBranchTablesRouteProps = {
  params: Promise<{
    branchId: string;
  }>;
};

const ManagerBranchTablesRoute = async ({ params }: ManagerBranchTablesRouteProps) => {
  const { branchId } = await params;

  return (
    <ProtectedRoute allowedRoles={["BRANCH_MANAGER"]}>
      <OwnerTableListPage branchId={branchId} portal="manager" />
    </ProtectedRoute>
  );
};

export default ManagerBranchTablesRoute;

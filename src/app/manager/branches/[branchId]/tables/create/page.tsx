import { ProtectedRoute } from "@/components/auth/protected-route";
import { OwnerTableCreatePage } from "@/components/owner/tables/owner-table-create-page";

type ManagerBranchTableCreateRouteProps = {
  params: Promise<{
    branchId: string;
  }>;
};

const ManagerBranchTableCreateRoute = async ({ params }: ManagerBranchTableCreateRouteProps) => {
  const { branchId } = await params;

  return (
    <ProtectedRoute allowedRoles={["BRANCH_MANAGER"]}>
      <OwnerTableCreatePage branchId={branchId} portal="manager" />
    </ProtectedRoute>
  );
};

export default ManagerBranchTableCreateRoute;

import { ProtectedRoute } from "@/components/auth/protected-route";
import { OwnerBranchOrdersPage } from "@/components/owner/orders/owner-branch-orders-page";

type ManagerBranchOrdersRouteProps = {
  params: Promise<{
    branchId: string;
  }>;
};

const ManagerBranchOrdersRoute = async ({ params }: ManagerBranchOrdersRouteProps) => {
  const { branchId } = await params;

  return (
    <ProtectedRoute allowedRoles={["BRANCH_MANAGER"]}>
      <OwnerBranchOrdersPage branchId={branchId} portal="manager" />
    </ProtectedRoute>
  );
};

export default ManagerBranchOrdersRoute;

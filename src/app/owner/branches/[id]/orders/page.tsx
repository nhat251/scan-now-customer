import { ProtectedRoute } from "@/components/auth/protected-route";
import { OwnerBranchOrdersPage } from "@/components/owner/orders/owner-branch-orders-page";

type OwnerBranchOrdersRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const OwnerBranchOrdersRoute = async ({ params }: OwnerBranchOrdersRouteProps) => {
  const { id } = await params;

  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <OwnerBranchOrdersPage branchId={id} />
    </ProtectedRoute>
  );
};

export default OwnerBranchOrdersRoute;

import { ProtectedRoute } from "@/components/auth/protected-route";
import { OwnerBranchDetailPage } from "@/components/owner/branches/owner-branch-detail-page";

type OwnerBranchRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const OwnerBranchRoute = async ({ params }: OwnerBranchRouteProps) => {
  const { id } = await params;

  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <OwnerBranchDetailPage branchId={id} mode="edit" />
    </ProtectedRoute>
  );
};

export default OwnerBranchRoute;

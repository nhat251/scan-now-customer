import { ProtectedRoute } from "@/components/auth/protected-route";
import { OwnerTableCreatePage } from "@/components/owner/tables/owner-table-create-page";

type OwnerBranchTableCreateRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const OwnerBranchTableCreateRoute = async ({ params }: OwnerBranchTableCreateRouteProps) => {
  const { id } = await params;

  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <OwnerTableCreatePage branchId={id} />
    </ProtectedRoute>
  );
};

export default OwnerBranchTableCreateRoute;

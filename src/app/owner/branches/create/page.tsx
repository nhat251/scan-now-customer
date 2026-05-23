import { ProtectedRoute } from "@/components/auth/protected-route";
import { OwnerBranchDetailPage } from "@/components/owner/branches/owner-branch-detail-page";

const OwnerCreateBranchRoute = () => {
  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <OwnerBranchDetailPage mode="create" />
    </ProtectedRoute>
  );
};

export default OwnerCreateBranchRoute;

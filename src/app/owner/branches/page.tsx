import { ProtectedRoute } from "@/components/auth/protected-route";
import { OwnerBranchesPage } from "@/components/owner/branches/owner-branches-page";

const OwnerBranchesRoute = () => {
  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <OwnerBranchesPage />
    </ProtectedRoute>
  );
};

export default OwnerBranchesRoute;

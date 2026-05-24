import { ProtectedRoute } from "@/components/auth/protected-route";
import { MY_BRANCH_ROLES } from "@/components/me/helpers";
import { MyBranchesPage } from "@/components/me/my-branches-page";

const MyBranchesRoute = () => {
  return (
    <ProtectedRoute allowedRoles={[...MY_BRANCH_ROLES]}>
      <MyBranchesPage />
    </ProtectedRoute>
  );
};

export default MyBranchesRoute;

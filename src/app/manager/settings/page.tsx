import { ProtectedRoute } from "@/components/auth/protected-route";
import { BranchSettingsPage } from "@/components/settings/branch-settings-page";

const ManagerSettingsRoute = () => {
  return (
    <ProtectedRoute allowedRoles={["BRANCH_MANAGER"]}>
      <BranchSettingsPage portal="manager" />
    </ProtectedRoute>
  );
};

export default ManagerSettingsRoute;

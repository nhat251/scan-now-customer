import { ProtectedRoute } from "@/components/auth/protected-route";
import { BranchSettingsPage } from "@/components/settings/branch-settings-page";

const OwnerSettingsRoute = () => {
  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <BranchSettingsPage portal="owner" />
    </ProtectedRoute>
  );
};

export default OwnerSettingsRoute;

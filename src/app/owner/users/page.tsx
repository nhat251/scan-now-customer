import { ProtectedRoute } from "@/components/auth/protected-route";
import { OwnerUsersPage } from "@/components/owner/users/owner-users-page";

const OwnerUsersRoute = () => {
  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <OwnerUsersPage />
    </ProtectedRoute>
  );
};

export default OwnerUsersRoute;

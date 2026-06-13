import { ProtectedRoute } from "@/components/auth/protected-route";
import { ManagerOrdersIndexPage } from "@/components/manager/manager-orders-index-page";

const ManagerOrdersRoute = () => {
  return (
    <ProtectedRoute allowedRoles={["BRANCH_MANAGER"]}>
      <ManagerOrdersIndexPage />
    </ProtectedRoute>
  );
};

export default ManagerOrdersRoute;

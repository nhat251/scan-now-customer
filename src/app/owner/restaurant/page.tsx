import { ProtectedRoute } from "@/components/auth/protected-route";
import { OwnerRestaurantPage } from "@/components/owner/restaurant/owner-restaurant-page";

const OwnerRestaurantRoute = () => {
  return (
    <ProtectedRoute allowedRoles={["OWNER"]}>
      <OwnerRestaurantPage />
    </ProtectedRoute>
  );
};

export default OwnerRestaurantRoute;

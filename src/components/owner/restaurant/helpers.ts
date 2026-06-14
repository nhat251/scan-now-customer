import type {
  OwnerRestaurantFormValues,
  RestaurantResponse,
  UpdateRestaurantRequest,
} from "@/types/user-management";

export const getDefaultOwnerRestaurantFormValues = (): OwnerRestaurantFormValues => ({
  name: "",
  slug: "",
  logoUrl: "",
  description: "",
});

export const toOwnerRestaurantFormValues = (
  restaurant?: RestaurantResponse
): OwnerRestaurantFormValues => ({
  name: restaurant?.name ?? "",
  slug: restaurant?.slug ?? "",
  logoUrl: restaurant?.logoUrl ?? "",
  description: restaurant?.description ?? "",
});

export const toUpdateRestaurantPayload = (
  value: OwnerRestaurantFormValues
): UpdateRestaurantRequest => ({
  name: value.name.trim(),
  slug: value.slug.trim(),
  logoUrl: value.logoUrl.trim() || null,
  description: value.description.trim() || null,
});

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { toOwnerRestaurantFormValues, toUpdateRestaurantPayload } from "@/components/owner/restaurant/helpers";
import { OwnerRestaurantForm } from "@/components/owner/restaurant/owner-restaurant-form";
import { getOwnerPortalNavItems } from "@/components/owner/users/owner-portal-nav";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { useUpdateOwnerRestaurantMutation } from "@/hooks/mutations/useOwnerRestaurantMutations";
import { useOwnerRestaurantQuery } from "@/hooks/queries/useOwnerRestaurantQuery";
import { useUserStore } from "@/stores/user";
import type { OwnerRestaurantFormValues } from "@/types/user-management";

export const OwnerRestaurantPage = () => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const restaurantQuery = useOwnerRestaurantQuery();
  const updateMutation = useUpdateOwnerRestaurantMutation();
  const [value, setValue] = useState<OwnerRestaurantFormValues>(toOwnerRestaurantFormValues());
  const [errors, setErrors] = useState<Partial<Record<keyof OwnerRestaurantFormValues, string>>>({});

  useEffect(() => {
    if (restaurantQuery.data) {
      setValue(toOwnerRestaurantFormValues(restaurantQuery.data));
    }
  }, [restaurantQuery.data]);

  const onChange = <Key extends keyof OwnerRestaurantFormValues>(key: Key, nextValue: OwnerRestaurantFormValues[Key]) => {
    setValue((current) => ({ ...current, [key]: nextValue }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof OwnerRestaurantFormValues, string>> = {};

    if (!value.name.trim()) {
      nextErrors.name = "Restaurant name is required.";
    }

    if (!value.slug.trim()) {
      nextErrors.slug = "Slug is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitForm = async () => {
    if (!validateForm()) {
      return;
    }

    await updateMutation.mutateAsync(toUpdateRestaurantPayload(value));
  };

  const error = restaurantQuery.error;
  const isAccessError = error instanceof AxiosError && [401, 403].includes(error.response?.status ?? 0);

  if (restaurantQuery.isError) {
    return (
      <PortalShell
        title="My Restaurant"
        description="View and update your restaurant profile."
        portalLabel="Management Suite"
        portalName="Owner Portal"
        navItems={getOwnerPortalNavItems("restaurant")}
        topbarTitle={currentUser?.fullName ?? "Owner Portal"}
        currentUser={currentUser}
      >
        <div className="border-border/60 bg-card rounded-[1.5rem] border p-8 shadow-sm">
          <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">Owner portal</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            {isAccessError ? "Your access could not be verified" : "We could not load your restaurant data"}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">
            {isAccessError
              ? "Your session may be expired or you may no longer have permission to view this restaurant."
              : "Please try again."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => restaurantQuery.refetch()} disabled={restaurantQuery.isRefetching}>
              Try again
            </Button>
            {isAccessError ? (
              <Button variant="outline" onClick={() => router.push(PATH.auth.login)}>
                Go to login
              </Button>
            ) : null}
          </div>
        </div>
      </PortalShell>
    );
  }

  const restaurant = restaurantQuery.data;

  return (
    <PortalShell
      title="My Restaurant"
      description="View and update your restaurant profile, brand assets, and summary details."
      portalLabel="Management Suite"
      portalName="Owner Portal"
      navItems={getOwnerPortalNavItems("restaurant")}
      topbarTitle={restaurant?.name ?? currentUser?.fullName ?? "Owner Portal"}
      currentUser={currentUser}
      stats={
        <>
          <PortalStatCard label="Restaurant" value={restaurant?.name ?? "-"} helper={restaurant?.slug ? `/${restaurant.slug}` : "Slug pending"} />
          <PortalStatCard label="Branches" value={String(restaurant?.totalBranches ?? 0)} helper="Total branches linked to this restaurant" />
          <PortalStatCard label="Owner Email" value={restaurant?.ownerEmail ?? "-"} helper={restaurant?.ownerPhone ?? "No phone on file"} />
          <PortalStatCard label="Status" value={restaurant?.isActive ? "Active" : "Inactive"} helper="Published restaurant availability" />
        </>
      }
    >
      <OwnerRestaurantForm
        value={value}
        errors={errors}
        submitting={updateMutation.isPending}
        onChange={onChange}
        onSubmit={submitForm}
      />
    </PortalShell>
  );
};

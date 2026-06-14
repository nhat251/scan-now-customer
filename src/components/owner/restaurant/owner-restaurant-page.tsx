"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import {
  toOwnerRestaurantFormValues,
  toUpdateRestaurantPayload,
} from "@/components/owner/restaurant/helpers";
import { OwnerRestaurantForm } from "@/components/owner/restaurant/owner-restaurant-form";
import { getOwnerPortalNavItems } from "@/components/owner/users/owner-portal-nav";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { useUpdateOwnerRestaurantMutation } from "@/hooks/mutations/useOwnerRestaurantMutations";
import { useOwnerRestaurantQuery } from "@/hooks/queries/useOwnerRestaurantQuery";
import { useUserStore } from "@/stores/user";
import type { OwnerRestaurantFormValues } from "@/types/user-management";
import { zodResolver } from "@hookform/resolvers/zod";

const ownerRestaurantSchema = z.object({
  name: z.string().trim().min(1, "Tên nhà hàng là bắt buộc."),
  slug: z.string().trim().min(1, "Đường dẫn định danh là bắt buộc."),
  logoUrl: z.string(),
  description: z.string(),
});

export const OwnerRestaurantPage = () => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const restaurantQuery = useOwnerRestaurantQuery();
  const updateMutation = useUpdateOwnerRestaurantMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OwnerRestaurantFormValues>({
    resolver: zodResolver(ownerRestaurantSchema),
    defaultValues: toOwnerRestaurantFormValues(),
  });

  useEffect(() => {
    if (restaurantQuery.data) {
      reset(toOwnerRestaurantFormValues(restaurantQuery.data));
    }
  }, [restaurantQuery.data, reset]);

  const submitForm = async (values: OwnerRestaurantFormValues) => {
    await updateMutation.mutateAsync(toUpdateRestaurantPayload(values));
  };

  const error = restaurantQuery.error;
  const isAccessError =
    error instanceof AxiosError && [401, 403].includes(error.response?.status ?? 0);

  if (restaurantQuery.isError) {
    return (
      <PortalShell
        title="Nhà hàng"
        description="Xem và cập nhật hồ sơ nhà hàng."
        portalLabel="Bộ quản lý"
        portalName="Cổng chủ quán"
        navItems={getOwnerPortalNavItems("restaurant")}
        topbarTitle={currentUser?.fullName ?? "Cổng chủ quán"}
        currentUser={currentUser}
      >
        <div className="border-border/60 bg-card rounded-[1.5rem] border p-8 shadow-sm">
          <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
            Cổng chủ quán
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            {isAccessError
              ? "Không xác minh được quyền truy cập"
              : "Không tải được dữ liệu nhà hàng"}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">
            {isAccessError
              ? "Phiên đăng nhập có thể đã hết hạn hoặc bạn không còn quyền xem nhà hàng này."
              : "Vui lòng thử lại."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() => restaurantQuery.refetch()}
              disabled={restaurantQuery.isRefetching}
            >
              Thử lại
            </Button>
            {isAccessError ? (
              <Button variant="outline" onClick={() => router.push(PATH.auth.login)}>
                Về trang đăng nhập
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
      title="Nhà hàng"
      description="Xem và cập nhật hồ sơ, thương hiệu và thông tin tổng quan của nhà hàng."
      portalLabel="Bộ quản lý"
      portalName="Cổng chủ quán"
      navItems={getOwnerPortalNavItems("restaurant")}
      topbarTitle={restaurant?.name ?? currentUser?.fullName ?? "Cổng chủ quán"}
      currentUser={currentUser}
      stats={
        <>
          <PortalStatCard
            label="Nhà hàng"
            value={restaurant?.name ?? "-"}
            helper={restaurant?.slug ? `/${restaurant.slug}` : "Chưa có slug"}
          />
          <PortalStatCard
            label="Chi nhánh"
            value={String(restaurant?.totalBranches ?? 0)}
            helper="Tổng chi nhánh thuộc nhà hàng"
          />
          <PortalStatCard
            label="Email chủ quán"
            value={restaurant?.ownerEmail ?? "-"}
            helper={restaurant?.ownerPhone ?? "Chưa có số điện thoại"}
          />
          <PortalStatCard
            label="Trạng thái"
            value={restaurant?.isActive ? "Hoạt động" : "Tạm tắt"}
            helper="Trạng thái hiển thị của nhà hàng"
          />
        </>
      }
    >
      <OwnerRestaurantForm
        register={register}
        errors={errors}
        submitting={updateMutation.isPending}
        onSubmit={handleSubmit(submitForm)}
      />
    </PortalShell>
  );
};

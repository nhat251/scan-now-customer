"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, DollarSign, Layers, PackageCheck } from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { useMyMenuItemQuery } from "@/hooks/queries/useMeQueries";
import { useUserStore } from "@/stores/user";

import {
  FALLBACK_MENU_IMAGE,
  formatCurrency,
  getActiveLabel,
  getApiErrorMessage,
  getAvailabilityLabel,
  getMyPortalNavItems,
  isForbiddenError,
} from "./helpers";

type MyMenuItemDetailPageProps = {
  menuItemId: string;
};

const DetailRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="border-border/60 flex flex-col gap-1 border-b py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
    <dt className="text-muted-foreground text-sm font-semibold">{label}</dt>
    <dd className="text-on-surface text-sm font-medium sm:text-right">{value || "-"}</dd>
  </div>
);

export const MyMenuItemDetailPage = ({ menuItemId }: MyMenuItemDetailPageProps) => {
  const currentUser = useUserStore((state) => state.user);
  const itemQuery = useMyMenuItemQuery(menuItemId);
  const item = itemQuery.data;
  const branchId = item?.branchId;

  return (
    <PortalShell
      title={item?.name ?? "Menu Item Detail"}
      description="View menu item details without editing content, pricing, or category settings."
      portalLabel="Branch Workspace"
      portalName="My Branch Portal"
      navItems={getMyPortalNavItems({ active: "menu", branchId, canSeeMenu: true })}
      topbarTitle={item?.branchName ?? currentUser?.fullName ?? "Menu Item Detail"}
      currentUser={currentUser}
      headerAction={
        branchId ? (
          <Button asChild variant="outline">
            <Link href={PATH.me.branchMenu(branchId)}>
              <ArrowLeft className="size-4" />
              Menu Availability
            </Link>
          </Button>
        ) : null
      }
      stats={
        <>
          <PortalStatCard
            label="Availability"
            value={item ? getAvailabilityLabel(item) : "-"}
            helper="Staff and kitchen can update this from the menu list"
          />
          <PortalStatCard label="Active Status" value={item ? getActiveLabel(item.isActive) : "-"} helper="Read-only" />
          <PortalStatCard label="Price" value={item ? formatCurrency(item.price) : "-"} helper="Price cannot be edited here" />
          <PortalStatCard
            label="Preparation"
            value={item ? `${item.preparationTime} min` : "-"}
            helper={item?.categoryName ?? "Category pending"}
          />
        </>
      }
    >
      {itemQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Loading menu item...</span>
        </div>
      ) : null}

      {itemQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <h2 className="text-lg font-semibold">
            {isForbiddenError(itemQuery.error)
              ? "You do not have permission to access this branch"
              : "Unable to load menu item"}
          </h2>
          <p className="mt-2 text-sm">
            {isForbiddenError(itemQuery.error)
              ? "You do not have permission to access this branch"
              : getApiErrorMessage(itemQuery.error, "Please try refreshing this item.")}
          </p>
          <Button className="mt-5" onClick={() => itemQuery.refetch()} disabled={itemQuery.isRefetching}>
            Retry
          </Button>
        </div>
      ) : null}

      {item ? (
        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="bg-card border-border/60 rounded-xl border p-4 shadow-sm">
            <div className="bg-surface-container relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src={item.imageUrl || FALLBACK_MENU_IMAGE}
                alt={item.name}
                fill
                unoptimized
                sizes="(max-width: 1280px) 100vw, 480px"
                className="object-cover"
              />
            </div>
          </div>

          <div className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-bold">Item Information</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {item.description || "No description provided."}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="bg-surface-container-low rounded-xl p-4">
                <DollarSign className="text-primary size-5" />
                <p className="mt-3 text-2xl font-bold">{formatCurrency(item.price)}</p>
                <p className="text-muted-foreground text-sm">Current price</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-4">
                <Clock className="text-primary size-5" />
                <p className="mt-3 text-2xl font-bold">{item.preparationTime} min</p>
                <p className="text-muted-foreground text-sm">Preparation time</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-4">
                <PackageCheck className="text-primary size-5" />
                <p className="mt-3 text-2xl font-bold">{getAvailabilityLabel(item)}</p>
                <p className="text-muted-foreground text-sm">Available status</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-4">
                <Layers className="text-primary size-5" />
                <p className="mt-3 text-2xl font-bold">{item.categoryName ?? "-"}</p>
                <p className="text-muted-foreground text-sm">Category</p>
              </div>
            </div>

            <dl className="mt-6">
              <DetailRow label="Name" value={item.name} />
              <DetailRow label="Description" value={item.description || "-"} />
              <DetailRow label="Category" value={item.categoryName || "-"} />
              <DetailRow label="Price" value={formatCurrency(item.price)} />
              <DetailRow label="Preparation Time" value={`${item.preparationTime} minutes`} />
              <DetailRow label="Available Status" value={getAvailabilityLabel(item)} />
              <DetailRow label="Active Status" value={getActiveLabel(item.isActive)} />
            </dl>
          </div>
        </section>
      ) : null}
    </PortalShell>
  );
};

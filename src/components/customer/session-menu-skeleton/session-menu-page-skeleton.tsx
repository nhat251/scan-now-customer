import { BottomCartSkeleton } from "./bottom-cart-skeleton";
import { FeaturedMenuSkeleton } from "./featured-menu-skeleton";
import { MenuControlsSkeleton } from "./menu-controls-skeleton";
import { MenuListSkeleton } from "./menu-list-skeleton";
import { SessionMenuBannerSkeleton } from "./session-menu-banner-skeleton";
import { SessionMenuHeaderSkeleton } from "./session-menu-header-skeleton";

export const SessionMenuPageSkeleton = () => (
  <main className="bg-background font-body-md text-on-surface relative mx-auto min-h-screen max-w-[480px] pb-32">
    <SessionMenuHeaderSkeleton />
    <SessionMenuBannerSkeleton />
    <FeaturedMenuSkeleton />
    <MenuControlsSkeleton />
    <MenuListSkeleton />
    <BottomCartSkeleton />
  </main>
);

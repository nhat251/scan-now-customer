import { ShoppingCart } from "lucide-react";

import { SkeletonBlock } from "./skeleton-block";

export const BottomCartSkeleton = () => (
  <div className="bg-surface/80 border-outline-variant/30 fixed bottom-0 left-0 z-50 w-full border-t px-4 pt-4 pb-8 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
    <div className="mx-auto flex max-w-[480px] items-center justify-between">
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="bg-surface-variant h-4 w-28" />
        <SkeletonBlock className="bg-surface-variant h-6 w-24" />
      </div>
      <div className="bg-primary shadow-primary/25 flex size-[52px] items-center justify-center rounded-2xl text-white shadow-lg">
        <ShoppingCart className="size-6 opacity-70" />
      </div>
    </div>
  </div>
);

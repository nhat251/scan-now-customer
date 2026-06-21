import { Utensils } from "lucide-react";

import { SkeletonBlock } from "./skeleton-block";

export const SessionMenuHeaderSkeleton = () => (
  <header className="bg-surface/95 sticky top-0 z-50 flex h-16 w-full items-center justify-between px-4 shadow-sm backdrop-blur-xl">
    <div className="flex items-center gap-2">
      <Utensils className="text-primary size-6" />
      <h1 className="font-headline-md text-headline-md text-primary font-bold">ScanNow</h1>
    </div>
    <div className="bg-primary-container flex items-center gap-2 rounded-full px-4 py-1.5">
      <Utensils className="text-on-primary-container size-4" />
      <SkeletonBlock className="h-4 w-12 bg-white/45" />
    </div>
  </header>
);

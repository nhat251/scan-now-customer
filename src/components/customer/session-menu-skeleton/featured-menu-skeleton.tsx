import { SkeletonBlock } from "./skeleton-block";

export const FeaturedMenuSkeleton = () => (
  <section className="pt-8">
    <div className="mb-4 flex items-end justify-between px-4">
      <SkeletonBlock className="bg-surface-variant h-6 w-40" />
      <SkeletonBlock className="bg-surface-variant size-5 rounded-full" />
    </div>
    <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-2">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="bg-surface-container-lowest block w-[160px] flex-shrink-0 rounded-2xl p-2 shadow-sm"
        >
          <SkeletonBlock className="bg-surface-variant mb-3 h-24 w-full rounded-lg" />
          <SkeletonBlock className="bg-surface-variant h-4 w-28" />
          <SkeletonBlock className="bg-surface-variant mt-2 h-5 w-20" />
        </div>
      ))}
    </div>
  </section>
);

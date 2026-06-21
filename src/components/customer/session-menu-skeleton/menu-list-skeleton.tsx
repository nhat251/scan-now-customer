import { SkeletonBlock } from "./skeleton-block";

export const MenuListSkeleton = () => (
  <section className="flex flex-col gap-4 px-4 pt-6">
    {[1, 2, 3, 4].map((item) => (
      <div
        key={item}
        className="border-outline-variant/30 flex gap-4 rounded-2xl border bg-white p-3 shadow-sm"
      >
        <SkeletonBlock className="bg-surface-variant h-24 w-24 flex-shrink-0 rounded-xl" />
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div>
            <SkeletonBlock className="bg-surface-variant h-5 w-36" />
            <SkeletonBlock className="bg-surface-variant mt-2 h-4 w-full" />
            <SkeletonBlock className="bg-surface-variant mt-1 h-4 w-3/4" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <SkeletonBlock className="bg-surface-variant h-5 w-20" />
            <SkeletonBlock className="bg-surface-variant size-10 rounded-full" />
          </div>
        </div>
      </div>
    ))}
  </section>
);

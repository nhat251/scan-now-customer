import { SkeletonBlock } from "./skeleton-block";

export const MenuControlsSkeleton = () => (
  <section className="flex gap-3 px-4 pt-8">
    {[1, 2].map((item) => (
      <div
        key={item}
        className="border-outline-variant flex flex-1 items-center justify-center gap-2 rounded-xl border bg-white py-3"
      >
        <SkeletonBlock className="bg-surface-variant size-5 rounded-full" />
        <SkeletonBlock className="bg-surface-variant h-4 w-20" />
      </div>
    ))}
  </section>
);

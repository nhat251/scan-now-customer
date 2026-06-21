import { SkeletonBlock } from "./skeleton-block";

export const SessionMenuBannerSkeleton = () => (
  <section className="px-4 pt-6">
    <div className="shadow-primary/20 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#f97316] to-[#d84315] p-6 text-white shadow-lg">
      <div className="relative z-10">
        <SkeletonBlock className="mb-3 h-3 w-36 bg-white/35" />
        <SkeletonBlock className="mb-3 h-8 w-56 bg-white/45" />
        <SkeletonBlock className="h-4 w-[80%] bg-white/35" />
        <SkeletonBlock className="mt-2 h-4 w-[56%] bg-white/25" />
      </div>
      <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute top-2 -right-4 h-20 w-20 rounded-full border-4 border-white/10" />
    </div>
  </section>
);

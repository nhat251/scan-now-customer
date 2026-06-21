import { cn } from "@/lib/utils";

type SkeletonBlockProps = {
  className?: string;
};

export const SkeletonBlock = ({ className }: SkeletonBlockProps) => (
  <div className={cn("animate-pulse rounded bg-white/30", className)} />
);

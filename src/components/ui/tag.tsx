import { cn } from "@/lib/utils";

export type TagType = {
  id: string;
  tagString: string;
};

type TagProps = {
  tagString: string;
  variant?: "default" | "success" | "warning" | "destructive";
};

const TAG_VARIANT_CLASSNAME: Record<NonNullable<TagProps["variant"]>, string> = {
  default: "text-foreground bg-accent-foreground dark:border-muted-foreground",
  success: "border-success/40 bg-success/20 text-success-foreground",
  warning: "border-warning/40 bg-warning/20 text-warning-foreground",
  destructive: "border-destructive/40 bg-destructive/20 text-destructive-foreground",
};

export function Tag({ tagString, variant = "default" }: TagProps) {
  return (
    <span
      className={cn("rounded-full border px-3 py-1 text-xs font-semibold", TAG_VARIANT_CLASSNAME[variant])}
    >
      {tagString}
    </span>
  );
}

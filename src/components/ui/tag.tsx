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
  success: "border-success/30 bg-success/15 text-success",
  warning: "border-warning/30 bg-warning/15 text-warning",
  destructive: "border-destructive/30 bg-destructive/15 text-destructive",
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

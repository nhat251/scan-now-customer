import { cn } from "@/lib/utils";

type PortalStatCardProps = {
  label: string;
  value: string;
  helper?: string;
  valueClassName?: string;
  helperClassName?: string;
};

export const PortalStatCard = ({
  label,
  value,
  helper,
  valueClassName,
  helperClassName,
}: PortalStatCardProps) => {
  return (
    <div className="bg-card border-border/60 min-w-0 rounded-xl border p-5 shadow-sm">
      <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
        {label}
      </p>
      <p
        className={cn("mt-3 min-w-0 text-3xl font-bold tracking-tight break-words", valueClassName)}
      >
        {value}
      </p>
      {helper ? (
        <p
          className={cn("text-muted-foreground mt-2 min-w-0 text-sm break-words", helperClassName)}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
};

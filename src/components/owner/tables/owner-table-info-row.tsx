import type { ReactNode } from "react";

type OwnerTableInfoRowProps = {
  label: string;
  value?: ReactNode;
};

export const OwnerTableInfoRow = ({ label, value }: OwnerTableInfoRowProps) => (
  <div className="border-border/60 flex flex-col gap-1 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
    <dt className="text-muted-foreground text-sm font-semibold">{label}</dt>
    <dd className="text-on-surface min-w-0 text-sm font-medium break-words sm:text-right">
      {value || "-"}
    </dd>
  </div>
);

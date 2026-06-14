import type { ReactNode } from "react";

type MeInfoRowProps = {
  label: string;
  value?: ReactNode;
};

export const MeInfoRow = ({ label, value }: MeInfoRowProps) => (
  <div className="border-border/60 flex flex-col gap-1 border-b py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
    <dt className="text-muted-foreground text-sm font-semibold">{label}</dt>
    <dd className="text-on-surface text-sm font-medium sm:text-right">{value || "-"}</dd>
  </div>
);

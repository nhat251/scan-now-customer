import { forwardRef } from "react";

import { cn } from "@/lib/utils";

type ReportDateFieldProps = {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const ReportDateField = forwardRef<HTMLInputElement, ReportDateFieldProps>(
  ({ label, className, ...rest }, ref) => (
    <label className="text-sm font-semibold">
      {label}
      <input
        ref={ref}
        type="date"
        className={cn(
          "border-input bg-card mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none",
          className
        )}
        {...rest}
      />
    </label>
  )
);

ReportDateField.displayName = "ReportDateField";

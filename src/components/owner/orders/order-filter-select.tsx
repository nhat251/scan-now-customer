import { forwardRef } from "react";

import { cn } from "@/lib/utils";

type OrderFilterSelectProps = {
  options: ReadonlyArray<{ label: string; value: string }>;
  className?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

export const OrderFilterSelect = forwardRef<HTMLSelectElement, OrderFilterSelectProps>(
  ({ options, className, ...rest }, ref) => (
    <select
      ref={ref}
      className={cn(
        "border-input bg-card h-10 w-full rounded-lg border px-3 pr-8 text-sm font-medium outline-none",
        "focus:border-ring focus:ring-ring/50 focus:ring-[3px]",
        "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23666%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.17l3.71-3.94a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200L5.21%208.27a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat",
        className
      )}
      {...rest}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
);

OrderFilterSelect.displayName = "OrderFilterSelect";

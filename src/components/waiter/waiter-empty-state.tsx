import { ChefHat } from "lucide-react";

type WaiterEmptyStateProps = {
  title: string;
  detail: string;
};

export const WaiterEmptyState = ({ title, detail }: WaiterEmptyStateProps) => (
  <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center">
    <ChefHat className="mb-3 size-12 text-stone-300" />
    <p className="text-sm font-semibold text-stone-700">{title}</p>
    <p className="mt-1 text-xs text-stone-500">{detail}</p>
  </div>
);

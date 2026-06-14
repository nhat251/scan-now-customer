import { ReceiptText } from "lucide-react";

type CashierEmptyStateProps = {
  title: string;
  detail: string;
};

export const CashierEmptyState = ({ title, detail }: CashierEmptyStateProps) => (
  <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center text-stone-400">
    <ReceiptText className="mb-3 size-12" />
    <p className="text-sm font-semibold text-stone-600">{title}</p>
    <p className="mt-1 text-xs">{detail}</p>
  </div>
);

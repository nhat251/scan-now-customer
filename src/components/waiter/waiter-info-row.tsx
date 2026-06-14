export function WaiterInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#ebe7df] bg-stone-50 px-4 py-3 text-sm">
      <span className="font-semibold text-stone-500">{label}</span>
      <span className="max-w-[60%] truncate font-bold">{value}</span>
    </div>
  );
}

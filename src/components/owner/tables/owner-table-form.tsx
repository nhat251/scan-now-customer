import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OwnerTableFormValues } from "@/types/owner-table";

type OwnerTableFormProps = {
  value: OwnerTableFormValues;
  submitting?: boolean;
  submitLabel?: string;
  onChange: <Key extends keyof OwnerTableFormValues>(key: Key, value: OwnerTableFormValues[Key]) => void;
  onSubmit: () => void;
};

export const OwnerTableForm = ({
  value,
  submitting = false,
  submitLabel = "Save Table",
  onChange,
  onSubmit,
}: OwnerTableFormProps) => {
  return (
    <section className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold">Table Number</span>
          <Input
            value={value.tableNumber}
            onChange={(event) => onChange("tableNumber", event.target.value)}
            placeholder="A7"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold">Capacity</span>
          <Input
            type="number"
            min={1}
            value={value.capacity}
            onChange={(event) => onChange("capacity", event.target.value)}
          />
        </label>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={onSubmit} disabled={submitting}>
          <Save className="size-4" />
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </section>
  );
};

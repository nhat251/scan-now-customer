import { Hash, Save, Users } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OwnerTableFormValues } from "@/types/owner-table";

type OwnerTableFormProps = {
  register: UseFormRegister<OwnerTableFormValues>;
  errors: FieldErrors<OwnerTableFormValues>;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: () => void;
};

export const OwnerTableForm = ({
  register,
  errors,
  submitting = false,
  submitLabel = "Lưu bàn",
  onSubmit,
}: OwnerTableFormProps) => {
  return (
    <section className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Thông tin bàn</h2>
          <p className="text-muted-foreground mt-1 text-sm">Chỉnh sửa số bàn và sức chứa</p>
        </div>
        <Button onClick={onSubmit} disabled={submitting}>
          <Save className="size-4" />
          {submitting ? "Đang lưu..." : submitLabel}
        </Button>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="table-number" required className="flex items-center gap-1.5">
            <Hash className="text-muted-foreground size-3.5" />
            Số bàn
          </Label>
          <Input
            id="table-number"
            placeholder="A7"
            aria-invalid={!!errors.tableNumber}
            {...register("tableNumber")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="table-capacity" required className="flex items-center gap-1.5">
            <Users className="text-muted-foreground size-3.5" />
            Sức chứa
          </Label>
          <Input
            id="table-capacity"
            type="number"
            min={1}
            placeholder="4"
            aria-invalid={!!errors.capacity}
            {...register("capacity")}
          />
        </div>
      </div>
    </section>
  );
};

import { useEffect } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateManageMenuItemPriceMutation } from "@/hooks/mutations/useManageMenuMutations";
import { showNotify } from "@/stores/global";
import { zodResolver } from "@hookform/resolvers/zod";

import { formatCurrency } from "./helpers";

type UpdatePriceDialogProps = {
  menuItemId: string;
  currentPrice: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PriceFormValues = {
  price: string;
  note: string;
};

const priceSchema = z.object({
  price: z.string().refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Giá mới phải lớn hơn 0." }
  ),
  note: z.string(),
});

export const UpdatePriceDialog = ({
  menuItemId,
  currentPrice,
  open,
  onOpenChange,
}: UpdatePriceDialogProps) => {
  const updatePriceMutation = useUpdateManageMenuItemPriceMutation();

  const { register, handleSubmit, reset } = useForm<PriceFormValues>({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      price: "",
      note: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        price: String(currentPrice),
        note: "",
      });
    }
  }, [currentPrice, open, reset]);

  const submit = async (values: PriceFormValues) => {
    await updatePriceMutation.mutateAsync({
      menuItemId,
      data: {
        price: Number(values.price),
        note: values.note.trim() || null,
      },
    });
    onOpenChange(false);
  };

  const onValidationError = (errors: FieldErrors<PriceFormValues>) => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      showNotify({ type: "warning", message: firstError.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cập nhật giá</DialogTitle>
          <DialogDescription>Lưu giá mới và ghi chú thay đổi nếu cần.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-surface-container-low rounded-xl p-4">
            <p className="text-muted-foreground text-sm font-semibold">Giá hiện tại</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(currentPrice)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-price" required>
              Giá mới
            </Label>
            <Input id="new-price" type="number" min={1} {...register("price")} />
          </div>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Ghi chú</span>
            <Textarea {...register("note")} />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit(submit, onValidationError)}
            disabled={updatePriceMutation.isPending}
          >
            {updatePriceMutation.isPending ? "Đang cập nhật..." : "Cập nhật giá"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

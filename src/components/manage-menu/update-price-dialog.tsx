import { useEffect } from "react";
import { type FieldErrors,useForm } from "react-hook-form";
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
  price: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, { message: "New price must be greater than 0." }),
  note: z.string(),
});

export const UpdatePriceDialog = ({ menuItemId, currentPrice, open, onOpenChange }: UpdatePriceDialogProps) => {
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
          <DialogTitle>Update Price</DialogTitle>
          <DialogDescription>Record a new price and optional audit note.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-surface-container-low rounded-xl p-4">
            <p className="text-muted-foreground text-sm font-semibold">Current Price</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(currentPrice)}</p>
          </div>
          <label className="space-y-2">
            <span className="text-sm font-semibold">
              New Price <span className="text-destructive">*</span>
            </span>
            <Input type="number" min={1} {...register("price")} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Note</span>
            <Textarea {...register("note")} />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit, onValidationError)} disabled={updatePriceMutation.isPending}>
            {updatePriceMutation.isPending ? "Updating..." : "Update Price"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

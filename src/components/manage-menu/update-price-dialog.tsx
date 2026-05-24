"use client";

import { useEffect, useState } from "react";

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

import { formatCurrency } from "./helpers";

type UpdatePriceDialogProps = {
  menuItemId: string;
  currentPrice: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const UpdatePriceDialog = ({ menuItemId, currentPrice, open, onOpenChange }: UpdatePriceDialogProps) => {
  const updatePriceMutation = useUpdateManageMenuItemPriceMutation();
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setPrice(String(currentPrice));
      setNote("");
    }
  }, [currentPrice, open]);

  const submit = async () => {
    const nextPrice = Number(price);

    if (!price || nextPrice <= 0) {
      showNotify({ type: "warning", message: "New price must be greater than 0." });
      return;
    }

    await updatePriceMutation.mutateAsync({
      menuItemId,
      data: {
        price: nextPrice,
        note: note.trim() || null,
      },
    });
    onOpenChange(false);
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
            <span className="text-sm font-semibold">New Price</span>
            <Input type="number" min={1} value={price} onChange={(event) => setPrice(event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Note</span>
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={updatePriceMutation.isPending}>
            {updatePriceMutation.isPending ? "Updating..." : "Update Price"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

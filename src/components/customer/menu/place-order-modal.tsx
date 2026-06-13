"use client";

import { AlertCircle, FileText, Phone, ShoppingBag, User, X } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";

const placeOrderSchema = z.object({
  customerName: z
    .string()
    .max(100, "Tên không được vượt quá 100 ký tự")
    .optional(),
  customerPhone: z
    .string()
    .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/g, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
  customerNote: z
    .string()
    .max(300, "Ghi chú không được dài quá 300 ký tự")
    .optional(),
});

type PlaceOrderFormValues = z.infer<typeof placeOrderSchema>;

type PlaceOrderModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (details: {
    customerName: string;
    customerPhone: string;
    customerNote: string;
  }) => void;
};

export const PlaceOrderModal = ({
  isOpen,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: PlaceOrderModalProps) => {
  const form = useForm<PlaceOrderFormValues>({
    resolver: zodResolver(placeOrderSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerNote: "",
    },
  });

  if (!isOpen) return null;

  const handleFormSubmit = (values: PlaceOrderFormValues) => {
    onSubmit({
      customerName: values.customerName || "",
      customerPhone: values.customerPhone || "",
      customerNote: values.customerNote || "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="w-full max-w-md rounded-t-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="flex items-center text-base font-bold text-white">
            <ShoppingBag className="mr-2 h-5 w-5 text-indigo-400" /> Thông tin đặt món
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <Controller
            name="customerName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.error ? "true" : "false"}>
                <FieldLabel className="text-slate-400">
                  <User className="mr-1.5 h-3.5 w-3.5" /> Tên khách hàng (Không bắt buộc)
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    placeholder="Nhập tên của bạn..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white transition outline-none focus:border-indigo-500 focus:ring-1"
                  />
                </FieldContent>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="customerPhone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.error ? "true" : "false"}>
                <FieldLabel className="text-slate-400">
                  <Phone className="mr-1.5 h-3.5 w-3.5" /> Số điện thoại (Không bắt buộc)
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    placeholder="Nhập số điện thoại..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white transition outline-none focus:border-indigo-500 focus:ring-1"
                  />
                </FieldContent>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="customerNote"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.error ? "true" : "false"}>
                <FieldLabel className="text-slate-400">
                  <FileText className="mr-1.5 h-3.5 w-3.5" /> Ghi chú (Ít cay, không hành, v.v.)
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    {...field}
                    placeholder="Thêm ghi chú cho nhà bếp..."
                    rows={2}
                    className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white transition outline-none focus:border-indigo-500 focus:ring-1"
                  />
                </FieldContent>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 border border-slate-800 text-slate-400 hover:text-white"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-indigo-600 font-semibold text-white hover:bg-indigo-500"
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" /> Đang gửi...
              </>
            ) : (
              "Gửi yêu cầu"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

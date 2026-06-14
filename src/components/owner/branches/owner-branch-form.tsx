import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { OwnerBranchFormValues } from "@/types/user-management";

type OwnerBranchFormProps = {
  mode: "create" | "edit";
  register: UseFormRegister<OwnerBranchFormValues>;
  errors: FieldErrors<OwnerBranchFormValues>;
  submitting: boolean;
  onSubmit: () => void;
};

export const OwnerBranchForm = ({
  mode,
  register,
  errors,
  submitting,
  onSubmit,
}: OwnerBranchFormProps) => {
  return (
    <section className="border-border/60 bg-card rounded-xl border p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">
          {mode === "create" ? "Tạo chi nhánh" : "Cập nhật chi nhánh"}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Cấu hình thông tin nhận diện, liên hệ, giờ mở cửa và các khoản phí của chi nhánh.
        </p>
      </div>

      <FieldGroup className="gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="branch-name" required>
              Tên chi nhánh
            </FieldLabel>
            <FieldContent>
              <Input
                id="branch-name"
                placeholder="Nhập tên chi nhánh"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError>{errors.name?.message}</FieldError>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="branch-slug" required>
              Đường dẫn định danh
            </FieldLabel>
            <FieldContent>
              <Input
                id="branch-slug"
                placeholder="branch-slug"
                aria-invalid={!!errors.slug}
                {...register("slug")}
              />
              <FieldError>{errors.slug?.message}</FieldError>
            </FieldContent>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="branch-email">Email</FieldLabel>
            <FieldContent>
              <Input
                id="branch-email"
                type="email"
                placeholder="branch@example.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <FieldError>{errors.email?.message}</FieldError>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="branch-phone">Số điện thoại</FieldLabel>
            <FieldContent>
              <Input
                id="branch-phone"
                placeholder="Số điện thoại liên hệ"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
              <FieldError>{errors.phone?.message}</FieldError>
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="branch-address">Địa chỉ</FieldLabel>
          <FieldContent>
            <Input
              id="branch-address"
              placeholder="Đường, phường/xã, quận/huyện, thành phố"
              aria-invalid={!!errors.address}
              {...register("address")}
            />
            <FieldError>{errors.address?.message}</FieldError>
          </FieldContent>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="branch-open-time">Giờ mở cửa</FieldLabel>
            <FieldContent>
              <Input
                id="branch-open-time"
                type="time"
                aria-invalid={!!errors.openTime}
                {...register("openTime")}
              />
              <FieldError>{errors.openTime?.message}</FieldError>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="branch-close-time">Giờ đóng cửa</FieldLabel>
            <FieldContent>
              <Input
                id="branch-close-time"
                type="time"
                aria-invalid={!!errors.closeTime}
                {...register("closeTime")}
              />
              <FieldError>{errors.closeTime?.message}</FieldError>
            </FieldContent>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="branch-vat-percent">VAT %</FieldLabel>
            <FieldContent>
              <Input
                id="branch-vat-percent"
                type="number"
                min="0"
                step="0.01"
                aria-invalid={!!errors.vatPercent}
                {...register("vatPercent")}
              />
              <FieldError>{errors.vatPercent?.message}</FieldError>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="branch-service-charge-percent">Phí dịch vụ %</FieldLabel>
            <FieldContent>
              <Input
                id="branch-service-charge-percent"
                type="number"
                min="0"
                step="0.01"
                aria-invalid={!!errors.serviceChargePercent}
                {...register("serviceChargePercent")}
              />
              <FieldError>{errors.serviceChargePercent?.message}</FieldError>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="branch-service-charge-fixed">Phí cố định</FieldLabel>
            <FieldContent>
              <Input
                id="branch-service-charge-fixed"
                type="number"
                min="0"
                step="0.01"
                aria-invalid={!!errors.serviceChargeFixed}
                {...register("serviceChargeFixed")}
              />
              <FieldError>{errors.serviceChargeFixed?.message}</FieldError>
            </FieldContent>
          </Field>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? "Đang lưu..." : mode === "create" ? "Tạo chi nhánh" : "Lưu thay đổi"}
          </Button>
        </div>
      </FieldGroup>
    </section>
  );
};

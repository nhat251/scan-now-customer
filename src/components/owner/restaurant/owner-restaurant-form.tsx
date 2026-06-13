import type { FieldErrors,UseFormRegister } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { OwnerRestaurantFormValues } from "@/types/user-management";

type OwnerRestaurantFormProps = {
  register: UseFormRegister<OwnerRestaurantFormValues>;
  errors: FieldErrors<OwnerRestaurantFormValues>;
  submitting: boolean;
  onSubmit: () => void;
};

export const OwnerRestaurantForm = ({ register, errors, submitting, onSubmit }: OwnerRestaurantFormProps) => {
  return (
    <section className="border-border/60 bg-card rounded-xl border p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Hồ sơ nhà hàng</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Cập nhật thông tin nhận diện và nội dung hiển thị trong cổng chủ quán.
        </p>
      </div>

      <FieldGroup className="gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="restaurant-name" required>Tên nhà hàng</FieldLabel>
            <FieldContent>
              <Input
                id="restaurant-name"
                placeholder="Nhập tên nhà hàng"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError>{errors.name?.message}</FieldError>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="restaurant-slug" required>Slug</FieldLabel>
            <FieldContent>
              <Input
                id="restaurant-slug"
                placeholder="restaurant-slug"
                aria-invalid={!!errors.slug}
                {...register("slug")}
              />
              <FieldError>{errors.slug?.message}</FieldError>
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="restaurant-logo-url">URL logo</FieldLabel>
          <FieldContent>
            <Input
              id="restaurant-logo-url"
              placeholder="https://example.com/logo.png"
              aria-invalid={!!errors.logoUrl}
              {...register("logoUrl")}
            />
            <FieldError>{errors.logoUrl?.message}</FieldError>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="restaurant-description">Mô tả</FieldLabel>
          <FieldContent>
            <textarea
              id="restaurant-description"
              placeholder="Mô tả nhà hàng"
              aria-invalid={!!errors.description}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-32 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              {...register("description")}
            />
            <FieldError>{errors.description?.message}</FieldError>
          </FieldContent>
        </Field>

        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? "Đang lưu..." : "Lưu nhà hàng"}
          </Button>
        </div>
      </FieldGroup>
    </section>
  );
};

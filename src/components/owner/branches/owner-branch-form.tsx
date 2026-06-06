import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { OwnerBranchFormValues } from "@/types/user-management";

type OwnerBranchFormProps = {
  mode: "create" | "edit";
  value: OwnerBranchFormValues;
  errors: Partial<Record<keyof OwnerBranchFormValues, string>>;
  submitting: boolean;
  onChange: <Key extends keyof OwnerBranchFormValues>(key: Key, value: OwnerBranchFormValues[Key]) => void;
  onSubmit: () => void;
};

export const OwnerBranchForm = ({ mode, value, errors, submitting, onChange, onSubmit }: OwnerBranchFormProps) => {
  return (
    <section className="border-border/60 bg-card rounded-xl border p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">{mode === "create" ? "Tạo chi nhánh" : "Cập nhật chi nhánh"}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Cấu hình thông tin nhận diện, liên hệ, giờ mở cửa và các khoản phí của chi nhánh.
        </p>
      </div>

      <FieldGroup className="gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="branch-name">Tên chi nhánh</FieldLabel>
            <FieldContent>
              <Input
                id="branch-name"
                value={value.name}
                onChange={(event) => onChange("name", event.target.value)}
                placeholder="Nhập tên chi nhánh"
                aria-invalid={!!errors.name}
              />
              <FieldError>{errors.name}</FieldError>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="branch-slug">Slug</FieldLabel>
            <FieldContent>
              <Input
                id="branch-slug"
                value={value.slug}
                onChange={(event) => onChange("slug", event.target.value)}
                placeholder="branch-slug"
                aria-invalid={!!errors.slug}
              />
              <FieldError>{errors.slug}</FieldError>
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
                value={value.email}
                onChange={(event) => onChange("email", event.target.value)}
                placeholder="branch@example.com"
                aria-invalid={!!errors.email}
              />
              <FieldError>{errors.email}</FieldError>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="branch-phone">Số điện thoại</FieldLabel>
            <FieldContent>
              <Input
                id="branch-phone"
                value={value.phone}
                onChange={(event) => onChange("phone", event.target.value)}
                placeholder="Số điện thoại liên hệ"
                aria-invalid={!!errors.phone}
              />
              <FieldError>{errors.phone}</FieldError>
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="branch-address">Địa chỉ</FieldLabel>
          <FieldContent>
            <Input
              id="branch-address"
              value={value.address}
              onChange={(event) => onChange("address", event.target.value)}
              placeholder="Đường, phường/xã, quận/huyện, thành phố"
              aria-invalid={!!errors.address}
            />
            <FieldError>{errors.address}</FieldError>
          </FieldContent>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="branch-open-time">Giờ mở cửa</FieldLabel>
            <FieldContent>
              <Input
                id="branch-open-time"
                type="time"
                value={value.openTime}
                onChange={(event) => onChange("openTime", event.target.value)}
                aria-invalid={!!errors.openTime}
              />
              <FieldError>{errors.openTime}</FieldError>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="branch-close-time">Giờ đóng cửa</FieldLabel>
            <FieldContent>
              <Input
                id="branch-close-time"
                type="time"
                value={value.closeTime}
                onChange={(event) => onChange("closeTime", event.target.value)}
                aria-invalid={!!errors.closeTime}
              />
              <FieldError>{errors.closeTime}</FieldError>
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
                value={value.vatPercent}
                onChange={(event) => onChange("vatPercent", event.target.value)}
                aria-invalid={!!errors.vatPercent}
              />
              <FieldError>{errors.vatPercent}</FieldError>
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
                value={value.serviceChargePercent}
                onChange={(event) => onChange("serviceChargePercent", event.target.value)}
                aria-invalid={!!errors.serviceChargePercent}
              />
              <FieldError>{errors.serviceChargePercent}</FieldError>
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
                value={value.serviceChargeFixed}
                onChange={(event) => onChange("serviceChargeFixed", event.target.value)}
                aria-invalid={!!errors.serviceChargeFixed}
              />
              <FieldError>{errors.serviceChargeFixed}</FieldError>
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

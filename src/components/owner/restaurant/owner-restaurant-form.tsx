import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { OwnerRestaurantFormValues } from "@/types/user-management";

type OwnerRestaurantFormProps = {
  value: OwnerRestaurantFormValues;
  errors: Partial<Record<keyof OwnerRestaurantFormValues, string>>;
  submitting: boolean;
  onChange: <Key extends keyof OwnerRestaurantFormValues>(key: Key, value: OwnerRestaurantFormValues[Key]) => void;
  onSubmit: () => void;
};

export const OwnerRestaurantForm = ({ value, errors, submitting, onChange, onSubmit }: OwnerRestaurantFormProps) => {
  return (
    <section className="border-border/60 bg-card rounded-xl border p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Restaurant profile</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Update your restaurant identity and the details shown across your owner portal.
        </p>
      </div>

      <FieldGroup className="gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="restaurant-name">Restaurant name</FieldLabel>
            <FieldContent>
              <Input
                id="restaurant-name"
                value={value.name}
                onChange={(event) => onChange("name", event.target.value)}
                placeholder="Enter restaurant name"
                aria-invalid={!!errors.name}
              />
              <FieldError>{errors.name}</FieldError>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="restaurant-slug">Slug</FieldLabel>
            <FieldContent>
              <Input
                id="restaurant-slug"
                value={value.slug}
                onChange={(event) => onChange("slug", event.target.value)}
                placeholder="restaurant-slug"
                aria-invalid={!!errors.slug}
              />
              <FieldError>{errors.slug}</FieldError>
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="restaurant-logo-url">Logo URL</FieldLabel>
          <FieldContent>
            <Input
              id="restaurant-logo-url"
              value={value.logoUrl}
              onChange={(event) => onChange("logoUrl", event.target.value)}
              placeholder="https://example.com/logo.png"
              aria-invalid={!!errors.logoUrl}
            />
            <FieldError>{errors.logoUrl}</FieldError>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="restaurant-description">Description</FieldLabel>
          <FieldContent>
            <textarea
              id="restaurant-description"
              value={value.description}
              onChange={(event) => onChange("description", event.target.value)}
              placeholder="Describe your restaurant"
              aria-invalid={!!errors.description}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-32 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            />
            <FieldError>{errors.description}</FieldError>
          </FieldContent>
        </Field>

        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save restaurant"}
          </Button>
        </div>
      </FieldGroup>
    </section>
  );
};

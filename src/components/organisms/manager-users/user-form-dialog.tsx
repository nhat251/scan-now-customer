import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { BranchResponse, ManagerUserFormValues, ManagerUserRoleOption } from "@/types/user-management";

import { BranchMultiSelect } from "./branch-multi-select";
import { FilterDropdown } from "./filter-dropdown";

export type FormMode = "create" | "edit";

const ROLE_OPTIONS: ManagerUserRoleOption[] = ["STAFF", "KITCHEN"];

type UserFormDialogProps = {
  branches: BranchResponse[];
  form: ManagerUserFormValues;
  mode: FormMode;
  open: boolean;
  showBranchSelection?: boolean;
  onBranchToggle: (branchId: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (field: keyof ManagerUserFormValues, value: string) => void;
  pending: boolean;
};

export const UserFormDialog = ({
  branches,
  form,
  mode,
  open,
  showBranchSelection = true,
  onBranchToggle,
  onClose,
  onSubmit,
  onChange,
  pending,
}: UserFormDialogProps) => {
  const selectedRoleLabel = ROLE_OPTIONS.find((role) => role === form.role) ?? "Select role";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create user" : "Update user"}</DialogTitle>
          <DialogDescription>
            Branch Managers can manage STAFF and KITCHEN users within their managed branches.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fullName">Full name</FieldLabel>
              <FieldContent>
                <Input id="fullName" value={form.fullName} onChange={(event) => onChange("fullName", event.target.value)} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <FieldContent>
                <Input id="username" value={form.username} onChange={(event) => onChange("username", event.target.value)} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <FieldContent>
                <Input id="email" type="email" value={form.email} onChange={(event) => onChange("email", event.target.value)} />
              </FieldContent>
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="phoneNumber">Phone number</FieldLabel>
              <FieldContent>
                <Input id="phoneNumber" value={form.phoneNumber} onChange={(event) => onChange("phoneNumber", event.target.value)} />
              </FieldContent>
            </Field>

            <FilterDropdown
              id="role"
              label="Role"
              value={form.role}
              displayValue={selectedRoleLabel}
              options={ROLE_OPTIONS.map((roleOption) => ({ label: roleOption, value: roleOption }))}
              onValueChange={(nextRole) => onChange("role", nextRole)}
            />

            {mode === "create" && (
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <FieldContent>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) => onChange("password", event.target.value)}
                  />
                </FieldContent>
              </Field>
            )}
          </FieldGroup>
        </div>

        {showBranchSelection ? (
          <BranchMultiSelect branches={branches} selectedBranchIds={form.branchIds} onBranchToggle={onBranchToggle} />
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={pending}>
            {mode === "create" ? "Create user" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getRoleLabel } from "@/constants/roleLabels";
import { cn } from "@/lib/utils";
import type { BranchResponse, ManagedUserRole, UserFormValues } from "@/types/user-management";

const ROLE_OPTIONS: ManagedUserRole[] = ["BRANCH_MANAGER", "STAFF", "KITCHEN", "CASHIER"];

type OwnerUserFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  value: UserFormValues;
  errors: Partial<Record<keyof UserFormValues, string>>;
  branches: BranchResponse[];
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: <Key extends keyof UserFormValues>(key: Key, value: UserFormValues[Key]) => void;
  onSubmit: () => void;
};

export const OwnerUserFormDialog = ({
  open,
  mode,
  value,
  errors,
  branches,
  submitting,
  onOpenChange,
  onChange,
  onSubmit,
}: OwnerUserFormDialogProps) => {
  const selectedBranchSet = useMemo(() => new Set(value.branchIds), [value.branchIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create user" : "Update user"}</DialogTitle>
          <DialogDescription>
            Owners can manage branch managers, staff, kitchen, and cashier users inside their restaurant.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="fullName">Full name</FieldLabel>
              <FieldContent>
                <Input
                  id="fullName"
                  value={value.fullName}
                  onChange={(event) => onChange("fullName", event.target.value)}
                  placeholder="Enter full name"
                  aria-invalid={!!errors.fullName}
                />
                <FieldError>{errors.fullName}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <FieldContent>
                <Input
                  id="username"
                  value={value.username}
                  onChange={(event) => onChange("username", event.target.value)}
                  placeholder="Enter username"
                  aria-invalid={!!errors.username}
                />
                <FieldError>{errors.username}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <FieldContent>
                <Input
                  id="email"
                  type="email"
                  value={value.email}
                  onChange={(event) => onChange("email", event.target.value)}
                  placeholder="name@example.com"
                  aria-invalid={!!errors.email}
                />
                <FieldError>{errors.email}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="phoneNumber">Phone number</FieldLabel>
              <FieldContent>
                <Input
                  id="phoneNumber"
                  value={value.phoneNumber}
                  onChange={(event) => onChange("phoneNumber", event.target.value)}
                  placeholder="Optional phone number"
                  aria-invalid={!!errors.phoneNumber}
                />
                <FieldError>{errors.phoneNumber}</FieldError>
              </FieldContent>
            </Field>

            {mode === "create" && (
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <FieldContent>
                  <Input
                    id="password"
                    type="password"
                    value={value.password}
                    onChange={(event) => onChange("password", event.target.value)}
                    placeholder="Enter password"
                    aria-invalid={!!errors.password}
                  />
                  <FieldError>{errors.password}</FieldError>
                </FieldContent>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="role">Role</FieldLabel>
              <FieldContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button id="role" variant="outline" className="w-full justify-between" aria-invalid={!!errors.role}>
                      {getRoleLabel(value.role)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                    <DropdownMenuRadioGroup value={value.role} onValueChange={(nextRole) => onChange("role", nextRole as ManagedUserRole)}>
                      {ROLE_OPTIONS.map((role) => (
                        <DropdownMenuRadioItem key={role} value={role}>
                          {getRoleLabel(role)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <FieldError>{errors.role}</FieldError>
              </FieldContent>
            </Field>
          </div>

          <Field>
            <FieldLabel>Branch assignment</FieldLabel>
            <FieldContent>
              <div className="border-border/70 grid gap-3 rounded-2xl border p-4 md:grid-cols-2">
                {branches.map((branch) => {
                  const checked = selectedBranchSet.has(branch.branchId);

                  return (
                    <DropdownMenu key={branch.branchId}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-auto justify-start rounded-2xl px-3 py-3 text-left",
                            checked ? "border-primary-container bg-primary-container/5" : "border-border/70 hover:bg-muted/50"
                          )}
                        >
                          <div>
                            <p className="font-medium">{branch.name}</p>
                            <p className="text-muted-foreground text-xs">{branch.address || branch.email || branch.slug}</p>
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-72">
                        <DropdownMenuCheckboxItem
                          checked={checked}
                          onCheckedChange={(nextChecked) => {
                            const shouldCheck = nextChecked === true;
                            const nextBranchIds = shouldCheck
                              ? [...value.branchIds, branch.branchId]
                              : value.branchIds.filter((branchId) => branchId !== branch.branchId);

                            onChange("branchIds", nextBranchIds);
                          }}
                        >
                          Assign {branch.name}
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                })}
              </div>
              <FieldError>{errors.branchIds}</FieldError>
            </FieldContent>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {mode === "create" ? "Create user" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";

type FilterDropdownProps<TValue extends string> = {
  id: string;
  label: string;
  value: TValue;
  displayValue: string;
  options: Array<{ label: string; value: TValue }>;
  onValueChange: (value: TValue) => void;
};

export const FilterDropdown = <TValue extends string>({
  id,
  label,
  value,
  displayValue,
  options,
  onValueChange,
}: FilterDropdownProps<TValue>) => {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <FieldContent>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id={id}
              variant="outline"
              className="bg-muted/50 h-12 w-full justify-between rounded-lg px-3 font-normal"
            >
              <span className="truncate">{displayValue}</span>
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
            <DropdownMenuRadioGroup
              value={value}
              onValueChange={(nextValue) => onValueChange(nextValue as TValue)}
            >
              {options.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </FieldContent>
    </Field>
  );
};

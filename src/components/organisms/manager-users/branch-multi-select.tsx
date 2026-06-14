import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tag } from "@/components/ui/tag";
import type { BranchResponse } from "@/types/user-management";

type BranchMultiSelectProps = {
  branches: BranchResponse[];
  selectedBranchIds: string[];
  onBranchToggle: (branchId: string) => void;
};

export const BranchMultiSelect = ({
  branches,
  selectedBranchIds,
  onBranchToggle,
}: BranchMultiSelectProps) => {
  const selectedCount = selectedBranchIds.length;

  let triggerLabel = "Chọn chi nhánh được quản lý";

  if (selectedCount === 1) {
    triggerLabel =
      branches.find((branch) => branch.branchId === selectedBranchIds[0])?.name ??
      "Đã chọn 1 chi nhánh";
  } else if (selectedCount > 1) {
    triggerLabel = `Đã chọn ${selectedCount} chi nhánh`;
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Chi nhánh được quản lý</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-muted/50 h-12 w-full justify-between rounded-lg px-3 font-normal"
          >
            <span className="truncate">{triggerLabel}</span>
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
          <DropdownMenuLabel>Chọn chi nhánh</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {branches.map((branch) => (
            <DropdownMenuCheckboxItem
              key={branch.branchId}
              checked={selectedBranchIds.includes(branch.branchId)}
              onCheckedChange={() => onBranchToggle(branch.branchId)}
            >
              {branch.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {branches
            .filter((branch) => selectedBranchIds.includes(branch.branchId))
            .map((branch) => (
              <Tag key={branch.branchId} tagString={branch.name} />
            ))}
        </div>
      )}
    </div>
  );
};

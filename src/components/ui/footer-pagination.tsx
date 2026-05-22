"use client";

import { ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getPageSizeLabel = (pageSize: number) => {
  return `${pageSize} / page`;
};

type FooterPaginationProps = {
  page: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  totalItems?: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export const FooterPagination = ({
  page,
  totalPages,
  pageSize,
  pageSizeOptions,
  totalItems,
  disabled = false,
  onPageChange,
  onPageSizeChange,
}: FooterPaginationProps) => {
  const safeTotalPages = Math.max(totalPages, 1);
  const safePage = Math.min(Math.max(page, 1), safeTotalPages);
  const canGoPrevious = !disabled && safePage > 1;
  const canGoNext = !disabled && safePage < safeTotalPages;
  const summary =
    totalItems === undefined ? `Page ${safePage} of ${safeTotalPages}` : `Page ${safePage} of ${safeTotalPages} · ${totalItems} users`;

  const goToPreviousPage = () => {
    onPageChange(safePage - 1);
  };

  const goToNextPage = () => {
    onPageChange(safePage + 1);
  };

  return (
    <div className="border-border/60 flex flex-col gap-3 border-t px-6 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-muted-foreground text-sm">{summary}</p>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between sm:w-36" disabled={disabled}>
              {getPageSizeLabel(pageSize)}
              <ChevronsUpDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
            <DropdownMenuRadioGroup value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
              {pageSizeOptions.map((size) => (
                <DropdownMenuRadioItem key={size} value={String(size)}>
                  {getPageSizeLabel(size)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={goToPreviousPage} disabled={!canGoPrevious}>
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <Button variant="outline" onClick={goToNextPage} disabled={!canGoNext}>
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};

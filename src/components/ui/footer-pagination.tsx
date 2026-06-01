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
import { cn } from "@/lib/utils";

const getPageSizeLabel = (pageSize: number) => {
  return `${pageSize} / page`;
};

const getVisiblePages = (page: number, totalPages: number) => {
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);

  if (page <= 3) {
    pages.add(2);
    pages.add(3);
  }

  if (page >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
  }

  return Array.from(pages)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
};

type FooterPaginationProps = {
  page: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  totalItems?: number;
  itemLabel?: string;
  disabled?: boolean;
  mode?: "default" | "numbers";
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export const FooterPagination = ({
  page,
  totalPages,
  pageSize,
  pageSizeOptions,
  totalItems,
  itemLabel = "items",
  disabled = false,
  mode = "default",
  onPageChange,
  onPageSizeChange,
}: FooterPaginationProps) => {
  const safeTotalPages = Math.max(totalPages, 1);
  const safePage = Math.min(Math.max(page, 1), safeTotalPages);
  const canGoPrevious = !disabled && safePage > 1;
  const canGoNext = !disabled && safePage < safeTotalPages;
  const visiblePages = getVisiblePages(safePage, safeTotalPages);
  const showPageSizePicker = pageSizeOptions.length > 1;
  const numberMode = mode === "numbers";
  const summary =
    totalItems === undefined ? `Page ${safePage} of ${safeTotalPages}` : `Page ${safePage} of ${safeTotalPages} - ${totalItems} ${itemLabel}`;

  const goToPreviousPage = () => {
    onPageChange(safePage - 1);
  };

  const goToNextPage = () => {
    onPageChange(safePage + 1);
  };

  return (
    <div
      className={
        numberMode
          ? "flex items-center justify-center px-4 py-5"
          : "border-border/60 flex flex-col gap-3 border-t px-6 py-4 md:flex-row md:items-center md:justify-between"
      }
    >
      {!numberMode ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-muted-foreground text-sm">{summary}</p>

          {showPageSizePicker ? (
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
          ) : (
            <p className="text-muted-foreground text-sm font-semibold">{getPageSizeLabel(pageSize)}</p>
          )}
        </div>
      ) : null}

      <div className={numberMode ? "flex flex-wrap items-center justify-center gap-3" : "flex flex-wrap items-center gap-2"}>
        <Button
          variant="outline"
          onClick={goToPreviousPage}
          disabled={!canGoPrevious}
          className={
            numberMode
              ? "h-12 min-w-[120px] rounded-full border-[#d9b39e] bg-white px-5 text-[15px] font-semibold text-[#cf8a61] disabled:opacity-40"
              : undefined
          }
        >
          <ChevronLeft className="size-4" />
          {!numberMode ? "Previous" : null}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {visiblePages.map((pageNumber, index) => {
            const previousPage = visiblePages[index - 1];
            const shouldShowGap = previousPage !== undefined && pageNumber - previousPage > 1;

            return (
              <span key={pageNumber} className="flex items-center gap-1">
                {shouldShowGap ? <span className="text-muted-foreground px-1 text-sm">...</span> : null}
                <Button
                  variant={pageNumber === safePage ? "default" : "outline"}
                  size={numberMode ? undefined : "icon"}
                  className={
                    numberMode
                      ? cn(
                          "h-12 min-w-12 rounded-full px-0 text-[15px] font-bold",
                          pageNumber === safePage
                            ? "border-0 bg-[#ffb07a] text-white shadow-none hover:bg-[#ffb07a]"
                            : "border-[#ead9cf] bg-white text-[#9d715b] hover:bg-[#fff7f1]",
                        )
                      : undefined
                  }
                  onClick={() => onPageChange(pageNumber)}
                  disabled={disabled || pageNumber === safePage}
                  aria-label={`Go to page ${pageNumber}`}
                >
                  {pageNumber}
                </Button>
              </span>
            );
          })}
        </div>
        <Button
          variant="outline"
          onClick={goToNextPage}
          disabled={!canGoNext}
          className={
            numberMode
              ? "h-12 min-w-[120px] rounded-full border-[#d9b39e] bg-white px-5 text-[15px] font-semibold text-[#cf8a61] disabled:opacity-40"
              : undefined
          }
        >
          {!numberMode ? "Next" : null}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};

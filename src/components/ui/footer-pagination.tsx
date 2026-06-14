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
  return `${pageSize} / trang`;
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
  compact?: boolean;
  hideWhenSinglePage?: boolean;
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
  itemLabel = "mục",
  disabled = false,
  compact = false,
  hideWhenSinglePage = false,
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
    totalItems === undefined
      ? `Trang ${safePage}/${safeTotalPages}`
      : `Trang ${safePage}/${safeTotalPages} - ${totalItems} ${itemLabel}`;

  if (hideWhenSinglePage && safeTotalPages <= 1) {
    return null;
  }

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
          ? compact
            ? "flex items-center justify-center px-2 py-2"
            : "flex items-center justify-center px-4 py-5"
          : "border-border/60 flex flex-col gap-3 border-t px-6 py-4 md:flex-row md:items-center md:justify-between"
      }
    >
      {!numberMode ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-muted-foreground text-sm">{summary}</p>

          {showPageSizePicker ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between sm:w-36"
                  disabled={disabled}
                >
                  {getPageSizeLabel(pageSize)}
                  <ChevronsUpDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-(--radix-dropdown-menu-trigger-width)"
              >
                <DropdownMenuRadioGroup
                  value={String(pageSize)}
                  onValueChange={(value) => onPageSizeChange(Number(value))}
                >
                  {pageSizeOptions.map((size) => (
                    <DropdownMenuRadioItem key={size} value={String(size)}>
                      {getPageSizeLabel(size)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <p className="text-muted-foreground text-sm font-semibold">
              {getPageSizeLabel(pageSize)}
            </p>
          )}
        </div>
      ) : null}

      <div
        className={
          numberMode
            ? cn("flex flex-wrap items-center justify-center", compact ? "gap-1.5" : "gap-3")
            : "flex flex-wrap items-center gap-2"
        }
      >
        <Button
          aria-label="Về trang trước"
          variant="outline"
          onClick={goToPreviousPage}
          disabled={!canGoPrevious}
          className={
            numberMode
              ? cn(
                  "rounded-full border-[#d9b39e] bg-white font-semibold text-[#cf8a61] disabled:opacity-40",
                  compact ? "size-9 px-0 text-sm" : "h-12 min-w-[120px] px-5 text-[15px]"
                )
              : undefined
          }
        >
          <ChevronLeft className="size-4" />
          {!numberMode ? "Trang trước" : null}
        </Button>
        <div className={cn("flex flex-wrap items-center", compact ? "gap-1.5" : "gap-2")}>
          {visiblePages.map((pageNumber, index) => {
            const previousPage = visiblePages[index - 1];
            const shouldShowGap = previousPage !== undefined && pageNumber - previousPage > 1;

            return (
              <span key={pageNumber} className="flex items-center gap-1">
                {shouldShowGap ? (
                  <span className="text-muted-foreground px-1 text-sm">...</span>
                ) : null}
                <Button
                  variant={pageNumber === safePage ? "default" : "outline"}
                  size={numberMode ? undefined : "icon"}
                  className={
                    numberMode
                      ? cn(
                          "rounded-full px-0 font-bold",
                          compact ? "size-9 min-w-9 text-sm" : "h-12 min-w-12 text-[15px]",
                          pageNumber === safePage
                            ? "border-0 bg-[#ffb07a] text-white shadow-none hover:bg-[#ffb07a]"
                            : "border-[#ead9cf] bg-white text-[#9d715b] hover:bg-[#fff7f1]"
                        )
                      : undefined
                  }
                  onClick={() => onPageChange(pageNumber)}
                  disabled={disabled || pageNumber === safePage}
                  aria-label={`Đi đến trang ${pageNumber}`}
                >
                  {pageNumber}
                </Button>
              </span>
            );
          })}
        </div>
        <Button
          aria-label="Sang trang tiếp theo"
          variant="outline"
          onClick={goToNextPage}
          disabled={!canGoNext}
          className={
            numberMode
              ? cn(
                  "rounded-full border-[#d9b39e] bg-white font-semibold text-[#cf8a61] disabled:opacity-40",
                  compact ? "size-9 px-0 text-sm" : "h-12 min-w-[120px] px-5 text-[15px]"
                )
              : undefined
          }
        >
          {!numberMode ? "Tiếp theo" : null}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};

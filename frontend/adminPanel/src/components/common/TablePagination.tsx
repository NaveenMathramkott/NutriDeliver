import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { getPageNumbers } from "./paginationUtils";

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Number of visible page buttons. Defaults to 5. */
  windowSize?: number;
}

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  windowSize = 5,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          />
        </PaginationItem>
        {getPageNumbers(currentPage, totalPages, windowSize).map((pageNum) => (
          <PaginationItem key={pageNum}>
            <PaginationLink
              isActive={currentPage === pageNum}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export interface TableFooterTextProps {
  currentPage: number;
  pageSize: number;
  total: number;
  itemLabel?: string;
}

export function TableFooterText({
  currentPage,
  pageSize,
  total,
  itemLabel = "items",
}: TableFooterTextProps) {
  if (total === 0) return null;
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);
  return (
    <p className="mt-3 text-sm text-muted-foreground">
      Showing {from} to {to} of {total} {itemLabel}
    </p>
  );
}

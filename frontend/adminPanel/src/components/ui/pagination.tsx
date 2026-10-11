"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  ({ className, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  ),
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

interface PaginationItemProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const PaginationItem = React.forwardRef<HTMLDivElement, PaginationItemProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  ),
);
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
  onClick?: (page: number) => void;
  page?: number;
  className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "onClick">;

const PaginationLink = ({
  className,
  isActive,
  onClick,
  page = 1,
  ...props
}: PaginationLinkProps) => (
  <a
    href={`?page=${page}`}
    onClick={(e) => {
      e.preventDefault();
      onClick?.(page);
    }}
    className={cn(
      "flex h-9 w-9 items-center justify-center text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
      isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
      className,
    )}
    {...props}
  >
    {page}
  </a>
);

const PaginationPrevious = ({
  className,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span className="sr-only">Previous</span>
  </button>
);

const PaginationNext = ({
  className,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <ChevronRight className="h-4 w-4" />
    <span className="sr-only">Next</span>
  </button>
);

const PaginationEllipsis = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "flex h-9 w-9 items-center justify-center text-sm text-muted-foreground",
      className,
    )}
    {...props}
  >
    ...
  </span>
);

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};

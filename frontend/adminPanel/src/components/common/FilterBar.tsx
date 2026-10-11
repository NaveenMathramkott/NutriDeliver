import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Set to false on screens without a server-side search term. */
  showSearch?: boolean;
  /** Optional single-select filters rendered after the search field. */
  filters?: {
    key: string;
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    options: FilterOption[];
  }[];
  /** Called when the search term or a filter changes. */
  onSearch?: () => void;
  className?: string;
}

const FILTER_WIDTH = "sm:w-[180px]";

/**
 * Search + filter toolbar shared by every list screen. Keeps controls on a
 * single aligned row that wraps responsively, with equal heights throughout.
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
  filters = [],
  onSearch,
  className,
}: FilterBarProps) {
  const hasActiveFilters = filters.some((f) => f.value !== "");

  const handleReset = () => {
    if (showSearch) onSearchChange("");
    filters.forEach((filter) => filter.onValueChange(""));
    onSearch?.();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch?.();
      }}
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center",
        className,
      )}
    >
      {showSearch && (
        <div className="relative w-full sm:max-w-md sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-10 pl-10"
          />
        </div>
      )}

      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={filter.value}
          onValueChange={filter.onValueChange}
        >
          <SelectTrigger
            className={cn("h-10", FILTER_WIDTH)}
            aria-label={filter.label}
          >
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {showSearch && (searchValue || hasActiveFilters) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-10 shrink-0"
        >
          <X className="h-4 w-4" />
          Reset
        </Button>
      )}
    </form>
  );
}

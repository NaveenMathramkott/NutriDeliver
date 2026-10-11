import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface TableStateProps {
  isLoading: boolean;
  isEmpty: boolean;
  colSpan: number;
  emptyMessage?: string;
}

/**
 * Renders the loading spinner / empty message rows shared by every table,
 * so all list screens handle empty and loading states identically.
 */
export function TableState({
  isLoading,
  isEmpty,
  colSpan,
  emptyMessage = "No records found",
}: TableStateProps) {
  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="py-10 text-center">
          <div className="flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (isEmpty) {
    return (
      <TableRow>
        <TableCell
          colSpan={colSpan}
          className="py-10 text-center text-muted-foreground"
        >
          {emptyMessage}
        </TableCell>
      </TableRow>
    );
  }

  return null;
}

export function DataTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-md border", className)}>
      <Table>{children}</Table>
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return (
    <TableHeader>
      <TableRow>{children}</TableRow>
    </TableHeader>
  );
}

export function DataTableBody({ children }: { children: React.ReactNode }) {
  return <TableBody>{children}</TableBody>;
}

export function DataTableRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <TableRow className={className}>{children}</TableRow>;
}

export { TableCell, TableHead };

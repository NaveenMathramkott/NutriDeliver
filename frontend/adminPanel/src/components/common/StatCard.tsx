import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  /** Tailwind classes for the icon tile, e.g. "bg-green-100 text-green-600". */
  tone?: string;
  hint?: string;
  hintTone?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  tone = "bg-primary/10 text-primary",
  hint,
  hintTone = "text-muted-foreground",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-5 text-card-foreground shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-bold tracking-tight">{value}</p>
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              tone,
            )}
          >
            {icon}
          </div>
        )}
      </div>
      {hint && <p className={cn("mt-2 text-sm", hintTone)}>{hint}</p>}
    </div>
  );
}

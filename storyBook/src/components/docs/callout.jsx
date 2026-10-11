import { AlertTriangle, Info, Lightbulb, TriangleAlert } from "lucide-react";
import { cn } from "../../lib/utils";

const VARIANTS = {
  note: {
    icon: Info,
    label: "Note",
    wrapper: "border-l-blue-500 bg-blue-500/8",
    badge: "text-blue-600 dark:text-blue-400",
    body: "text-blue-700 dark:text-blue-300/90",
  },
  tip: {
    icon: Lightbulb,
    label: "Tip",
    wrapper: "border-l-emerald-500 bg-emerald-500/8",
    badge: "text-emerald-600 dark:text-emerald-400",
    body: "text-emerald-700 dark:text-emerald-300/90",
  },
  warning: {
    icon: TriangleAlert,
    label: "Warning",
    wrapper: "border-l-amber-500 bg-amber-500/8",
    badge: "text-amber-600 dark:text-amber-400",
    body: "text-amber-700 dark:text-amber-300/90",
  },
  danger: {
    icon: AlertTriangle,
    label: "Danger",
    wrapper: "border-l-destructive bg-destructive/8",
    badge: "text-destructive",
    body: "text-destructive/90",
  },
};

/**
 * Callout boxes. Register extra variants by extending VARIANTS above.
 */
export function Callout({ variant = "note", title, children }) {
  const config = VARIANTS[variant] ?? VARIANTS.note;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "my-5 flex gap-3 rounded-r-lg border border-l-[3px] border-border py-3.5 pr-4 pl-4",
        config.wrapper,
      )}
    >
      <Icon size={17} className={cn("mt-0.5 shrink-0", config.badge)} />
      <div className="min-w-0 text-[0.925rem] leading-relaxed">
        <p className={cn("m-0 font-semibold", config.badge)}>
          {title ?? config.label}
        </p>
        <div className={cn("mt-1 [&>*:first-child]:mt-0", config.body)}>
          {children}
        </div>
      </div>
    </div>
  );
}

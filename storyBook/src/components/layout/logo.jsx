import { cn } from "../../lib/utils";

export function Logo({ className }) {
  return (
    <img
      src="/app_logo.png"
      alt="Logo"
      width={32}
      height={32}
      className={cn("text-brand", className)}
      aria-hidden="true"
    />
  );
}

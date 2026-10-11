import { Moon, Search, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useSearch } from "../../lib/search-context";
import { useTheme } from "../../lib/theme-context";
import { cn } from "../../lib/utils";
import { Logo } from "./logo";
import { RepoBadges } from "./repo-badges";

/**
 * Sticky site header. Sticky rather than fixed, so in-page anchors only need a
 * single `scroll-padding-top` to clear it.
 */
export function Header({ onOpenNav }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="-ml-1 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
        >
          <MenuIcon />
        </button>

        <Link
          to="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <Logo />
          <span className="hidden sm:inline">
            Nutri<span className="text-brand">Deliver</span>
          </span>
        </Link>

        <span className="hidden text-muted-foreground/40 md:inline">/</span>
        <span className="hidden text-sm text-muted-foreground md:inline">
          Build Guide
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <SearchTrigger />
          <ThemeToggle />
          <RepoBadges className="hidden sm:flex" />
        </div>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function SearchTrigger() {
  const { open } = useSearch();

  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "flex h-8 items-center gap-2 rounded-md border border-border px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        "sm:w-60",
      )}
    >
      <Search size={14} />
      <span className="hidden sm:inline">Search docs…</span>
      <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 font-mono text-[10px] sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}

function MenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

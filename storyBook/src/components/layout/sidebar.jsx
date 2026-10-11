import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { sections } from "../../lib/navigation";
import { pageHref } from "../../lib/urls";
import { cn } from "../../lib/utils";

function SectionGroup({ section, pathname, onNavigate }) {
  const isActiveSection = section.pages.some((p) => pageHref(p) === pathname);

  // Explicit user toggles win; anything the user has not touched falls back to
  // "open if this section contains the active page". Deriving rather than
  // syncing with an effect keeps the render pure and avoids a cascading update.
  const [overrides, setOverrides] = useState({});
  const open = overrides[section.title] ?? isActiveSection;

  function toggle() {
    setOverrides((prev) => ({ ...prev, [section.title]: !open }));
  }

  return (
    <div className="py-1">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-semibold transition-colors hover:text-foreground"
      >
        <ChevronIcon open={open} />
        <span
          className={cn(
            isActiveSection ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {section.title}
        </span>
      </button>

      {open && (
        <ul className="mt-0.5 space-y-0.5 border-l border-border pl-3">
          {section.pages.map((page) => {
            const href = pageHref(page);
            const active = href === pathname;
            return (
              <li key={page.slug}>
                <Link
                  to={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  {page.title}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Left-hand navigation. Rendered inline on desktop, in a drawer on mobile. */
export function Sidebar({ pathname, onNavigate, className }) {
  const scrollRef = useRef(null);

  // Bring the active link into view when navigating via prev/next or search.
  useEffect(() => {
    const el = scrollRef.current?.querySelector('[aria-current="page"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  return (
    <nav
      ref={scrollRef}
      aria-label="Documentation"
      className={cn("px-3 py-4", className)}
    >
      {sections.map((section) => (
        <SectionGroup
          key={section.title}
          section={section}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(
        "shrink-0 text-muted-foreground transition-transform",
        open ? "rotate-90" : "",
      )}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

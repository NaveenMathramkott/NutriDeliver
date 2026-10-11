import { ArrowRight, CornerDownLeft, FileText, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../lib/search-context";
import { cn } from "../../lib/utils";
import { pageHref } from "../../lib/urls";

// ⌘K / ctrl-K opens it, or the header button
export function SearchDialog() {
  const { isOpen, open, close, query, setQuery, results, loading } =
    useSearch();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [active, setActive] = useState(0);

  // clamp instead of resetting in an effect, to avoid a cascading render
  const activeIndex = results.length ? Math.min(active, results.length - 1) : 0;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isOpen) close();
        else open();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, open, close]);

  const show = useMemo(() => results.length > 0, [results]);

  if (!isOpen) return null;

  function onKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) =>
        results.length ? (i - 1 + results.length) % results.length : 0,
      );
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      navigate(pageHref(results[activeIndex]));
      close();
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Search documentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search size={16} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the guide…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search query"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {loading ? (
          <div className="space-y-2 p-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-1 py-1.5">
                <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-2/3 animate-pulse rounded bg-muted/60" />
                </div>
              </div>
            ))}
          </div>
        ) : show ? (
          <ul className="max-h-[50vh] overflow-y-auto p-2">
            {results.map((result, i) => (
              <li key={result.slug}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    navigate(pageHref(result));
                    close();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    i === activeIndex ? "bg-accent" : "",
                  )}
                >
                  <FileText
                    size={15}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {result.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {result.section} · {result.description}
                    </span>
                  </span>
                  {i === activeIndex && (
                    <CornerDownLeft
                      size={13}
                      className="shrink-0 text-muted-foreground"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No results for{" "}
            <span className="font-medium text-foreground">“{query}”</span>
          </p>
        )}

        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ArrowRight size={11} /> Navigate
          </span>
          <span>
            {results.length} result{results.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}

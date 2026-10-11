import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchContext } from "./search-context";
import { buildIndex, search } from "./search-index";

export function SearchProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  // `null` until first needed. Loading and rendering all 34 chapters to extract
  // their text is work a visitor who never searches should not pay for, so the
  // corpus is built on first open rather than at module load.
  const [index, setIndex] = useState(null);

  const results = useMemo(() => {
    if (!index) return [];
    return search(index, query);
  }, [index, query]);

  const open = useCallback(() => {
    setIsOpen(true);
    if (!index) {
      buildIndex()
        .then(setIndex)
        .catch(() => {
          // A failed index degrades search to an empty palette rather than
          // taking the page down with it.
          setIndex([]);
        });
    }
  }, [index]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  // Keep the palette usable if the user presses ⌘K the instant it opens.
  useEffect(() => {
    if (!isOpen || index) return;
    let cancelled = false;
    buildIndex().then((built) => {
      if (!cancelled) setIndex(built);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, index]);

  return (
    <SearchContext.Provider
      value={{ isOpen, open, close, query, setQuery, results, loading: !index }}
    >
      {children}
    </SearchContext.Provider>
  );
}

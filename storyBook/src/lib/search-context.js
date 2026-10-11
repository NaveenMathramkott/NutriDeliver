import { createContext, use } from "react";

export const SearchContext = createContext(null);

export function useSearch() {
  const ctx = use(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside <SearchProvider>");
  return ctx;
}

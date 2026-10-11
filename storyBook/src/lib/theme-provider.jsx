import { useCallback, useEffect, useState } from "react";
import { ThemeContext } from "./theme-context";

const STORAGE_KEY = "nutridocs-theme";

export function ThemeProvider({ children }) {
  // The inline script in index.html already resolved the theme before paint, so
  // read it back off <html> rather than recomputing — that keeps React state
  // and the DOM from ever disagreeing.
  const [theme, setTheme] = useState(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable in private mode; in-memory state still works.
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

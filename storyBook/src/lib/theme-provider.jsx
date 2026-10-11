import { useCallback, useEffect, useState } from "react";
import { ThemeContext } from "./theme-context";

const STORAGE_KEY = "nutridocs-theme";

export function ThemeProvider({ children }) {
  // read back off <html>; the inline script already resolved it pre-paint
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
      // private mode can block storage; in-memory state still works
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

import { useCallback, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { DocPage } from "./components/docs/doc-page";
import { Landing } from "./components/landing";
import { Header } from "./components/layout/header";
import { MobileNav } from "./components/layout/mobile-nav";
import { SearchDialog } from "./components/layout/search-dialog";
import { Sidebar } from "./components/layout/sidebar";
import { SearchProvider } from "./lib/search-provider";
import { ThemeProvider } from "./lib/theme-provider";

export default function App() {
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = useCallback(() => setNavOpen(false), []);
  const { pathname } = useLocation();

  return (
    <ThemeProvider>
      <SearchProvider>
        <div className="min-h-screen bg-background">
          <Header onOpenNav={() => setNavOpen(true)} />

          <div className="mx-auto flex w-full max-w-[1600px]">
            <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-border lg:block">
              <Sidebar pathname={pathname} />
            </aside>

            <main className="min-w-0 flex-1">
              <Routes>
                <Route path="/" element={<Landing />} />
                {/* A splat, not `:slug` — chapter slugs contain slashes
                    themselves (e.g. "backend/cart-orders"), which a single
                    path segment cannot match. */}
                <Route path="/docs/*" element={<DocPage />} />
                <Route path="*" element={<DocPage />} />
              </Routes>
            </main>
          </div>

          <MobileNav open={navOpen} onClose={closeNav} pathname={pathname} />
          <SearchDialog />
        </div>
      </SearchProvider>
    </ThemeProvider>
  );
}

import { Suspense } from "react";
import { lazyPages } from "./lazy-pages";

function ChapterFallback() {
  return (
    <div
      className="my-8 space-y-4"
      aria-busy="true"
      aria-label="Loading chapter"
    >
      <div className="h-7 w-2/3 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-full animate-pulse rounded-md bg-muted/70" />
      <div className="h-4 w-5/6 animate-pulse rounded-md bg-muted/70" />
      <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted/70" />
      <div className="mt-8 h-40 w-full animate-pulse rounded-lg bg-muted/50" />
    </div>
  );
}

export function DocsContent({ slug }) {
  const Page = lazyPages[slug];
  if (!Page) return null;

  return (
    <Suspense fallback={<ChapterFallback />}>
      <Page />
    </Suspense>
  );
}

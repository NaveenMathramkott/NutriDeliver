import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

/**
 * "On this page" rail.
 *
 * Scroll-spy via IntersectionObserver rather than a scroll handler: the
 * observer picks the topmost intersecting heading, which stays accurate during
 * fast scrolling where scroll-position maths lags behind.
 */
export function Toc({ headings }) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? null);

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // Bias the root margin upwards so the heading under the sticky header wins.
      { rootMargin: "-80px 0px -70% 0px", threshold: [0, 1] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 font-medium">On this page</p>
      <ul className="space-y-2 border-l border-border">
        {headings.map((h, i) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={() => setActiveId(h.id)}
              className={cn(
                "-ml-px block border-l py-0.5 pl-4 transition-colors",
                i > 0 && "pl-7",
                activeId === h.id
                  ? "border-brand font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

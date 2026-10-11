import { flatPages } from "./navigation";
import { contentLoaders } from "../components/docs/content-registry";

/**
 * Builds the search corpus by rendering every chapter into a detached DOM node
 * and reading back its text.
 *
 * Walking the React element tree is not enough: most chapter content sits
 * inside our own components (`CodeBlock`, `PropertyTable`, `Diagram`), whose
 * rendered output only exists after React has run them. Rendering to real DOM
 * and reading `textContent` sees everything the reader actually sees, including
 * component-generated text and code samples.
 *
 * This pulls the whole guide into memory, which is why it runs only when a
 * visitor first opens search — the chapters themselves stay code-split.
 */
export async function buildIndex() {
  const { createRoot } = await import("react-dom/client");
  const { createElement } = await import("react");

  const components = await Promise.all(
    flatPages.map(async (page) => [page, await contentLoaders[page.slug]?.()]),
  );

  const host = document.createElement("div");
  // Off-screen rather than hidden: `display: none` would still produce
  // textContent, but keeping it rendered avoids any layout-thrash surprises
  // for components that measure themselves.
  host.style.cssText = "position:absolute;left:-9999px;top:0;width:1200px;";
  document.body.appendChild(host);

  const root = createRoot(host);
  const entries = [];

  try {
    for (let i = 0; i < flatPages.length; i++) {
      const page = flatPages[i];
      const Component = components[i][1];

      let body = "";
      if (Component) {
        // One component at a time: clearing between chapters keeps this cheap
        // and prevents a previous chapter's text leaking into the next entry.
        root.render(createElement(Component));
        // React 18+ commits asynchronously; let it flush before reading.
        await new Promise((resolve) => requestAnimationFrame(() => resolve()));
        body = host.textContent ?? "";
      }

      entries.push({
        slug: page.slug,
        title: page.title,
        section: page.section,
        description: page.description,
        haystack:
          `${page.title} ${page.description} ${page.section} ${body}`.toLowerCase(),
      });
    }
  } finally {
    root.unmount();
    host.remove();
  }

  return entries;
}

/**
 * Scores an entry against a query. Title matches outrank body matches, an
 * exact title beats a prefix, and a prefix beats a loose substring.
 */
export function score(entry, terms) {
  let total = 0;

  for (const term of terms) {
    const title = entry.title.toLowerCase();
    let best = 0;

    if (title === term) best = 100;
    else if (title.startsWith(term)) best = 80;
    else if (title.includes(term)) best = 55;
    else if (entry.haystack.includes(term)) {
      // Reward denser matches, but cap the bonus so a long chapter cannot
      // out-rank a precise title hit purely on word count.
      let count = 0;
      let idx = entry.haystack.indexOf(term);
      while (idx !== -1 && count < 20) {
        count++;
        idx = entry.haystack.indexOf(term, idx + term.length);
      }
      best = 20 + Math.min(count, 6) * 3;
    }

    if (best === 0) return 0; // Every term must match somewhere.
    total += best;
  }

  return total;
}

export function search(index, query) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return index.slice(0, 8);

  return index
    .map((entry) => ({ ...entry, score: score(entry, terms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

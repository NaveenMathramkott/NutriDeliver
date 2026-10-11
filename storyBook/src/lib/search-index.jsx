import { flatPages } from "./navigation";
import { contentLoaders } from "../components/docs/content-registry";

// render each chapter detached, since the content only exists after React runs
export async function buildIndex() {
  const { createRoot } = await import("react-dom/client");
  const { createElement } = await import("react");

  const components = await Promise.all(
    flatPages.map(async (page) => [page, await contentLoaders[page.slug]?.()]),
  );

  const host = document.createElement("div");
  // off-screen not display:none, so measuring components don't thrash
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
        // one at a time, so text can't leak across entries
        root.render(createElement(Component));
        // react 18+ commits async, let it flush before reading
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

// title hits outrank body hits; exact > prefix > substring
export function score(entry, terms) {
  let total = 0;

  for (const term of terms) {
    const title = entry.title.toLowerCase();
    let best = 0;

    if (title === term) best = 100;
    else if (title.startsWith(term)) best = 80;
    else if (title.includes(term)) best = 55;
    else if (entry.haystack.includes(term)) {
      // reward density but cap it, so a long chapter can't out-rank a title hit
      let count = 0;
      let idx = entry.haystack.indexOf(term);
      while (idx !== -1 && count < 20) {
        count++;
        idx = entry.haystack.indexOf(term, idx + term.length);
      }
      best = 20 + Math.min(count, 6) * 3;
    }

    if (best === 0) return 0; // every term has to match somewhere
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

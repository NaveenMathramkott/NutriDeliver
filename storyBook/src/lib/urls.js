// Every chapter lives under /docs so the landing page keeps its own route.
export function pageHref(page) {
  return `/docs/${page.slug}`;
}

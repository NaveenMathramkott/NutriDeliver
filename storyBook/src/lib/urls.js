/**
 * Maps a navigation slug to its public URL.
 *
 * Every chapter lives under /docs — including the overview — so the marketing
 * landing page at / keeps its own route and the guide stays one flat namespace.
 */
export function pageHref(page) {
  return `/docs/${page.slug}`;
}

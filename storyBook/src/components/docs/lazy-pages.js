import { lazy } from "react";
import { contentLoaders } from "./content-registry";

/**
 * Wrap every loader in `lazy` once, at module load, rather than on each render.
 *
 * Building these at module scope matters for correctness, not just lint: a
 * `lazy()` result created during render is a *new* component identity every
 * time, which would throw away all state below it on every parent re-render.
 *
 * Each loader is re-wrapped so it resolves to `{ default }`. React's `lazy`
 * requires a module namespace object and treats a bare component as a module
 * with no default export, which fails with "element type is invalid".
 */
export const lazyPages = Object.fromEntries(
  Object.entries(contentLoaders).map(([slug, load]) => [
    slug,
    lazy(() => load().then((mod) => ({ default: mod }))),
  ]),
);

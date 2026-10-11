import { lazy } from "react";
import { contentLoaders } from "./content-registry";

// wrapped at module load; a render-time lazy() loses state on re-render
export const lazyPages = Object.fromEntries(
  Object.entries(contentLoaders).map(([slug, load]) => [
    slug,
    lazy(() => load().then((mod) => ({ default: mod }))),
  ]),
);

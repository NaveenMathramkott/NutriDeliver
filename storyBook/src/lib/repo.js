/**
 * Single source of truth for the upstream repository.
 *
 * Referenced from the header, the landing page, the chapter footer, and the
 * release feed — so pointing the docs at a fork is a one-line change rather
 * than a find-and-replace across a dozen components.
 */
export const REPO = {
  owner: "NaveenMathramkott",
  name: "NutriDeliver",
  url: "https://github.com/NaveenMathramkott/NutriDeliver",
};

/**
 * Displayed when no GitHub release has been published yet.
 *
 * A missing release should degrade to a plain source link, never to a broken
 * or empty badge — see `components/layout/repo-badges.jsx`.
 */
export const FALLBACK_VERSION = "v1.0.0";

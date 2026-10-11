import { GitFork, Star, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { FALLBACK_VERSION, REPO } from "../../lib/repo";
import { GitHubIcon } from "../icons";
import { cn } from "../../lib/utils";

/**
 * GitHub stars, forks and latest release tag.
 *
 * Two constraints shaped this component:
 *
 *  1. The version badge must only appear once an actual release exists, so the
 *     tag comes from the GitHub releases API rather than from package.json.
 *     Before the first release, this renders nothing.
 *
 *  2. It must never break the page. The fetch is unauthenticated and therefore
 *     rate-limited to 60 requests an hour per IP, and a docs site is often
 *     viewed offline. Every failure path degrades to hiding the affected badge
 *     rather than showing an error.
 *
 * The result is cached in sessionStorage: the badges are cosmetic, and
 * re-fetching on every page navigation would burn the rate limit for nothing.
 */
const CACHE_KEY = "nutridocs-github-meta";
const CACHE_TTL_MS = 30 * 60 * 1000;

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    return Date.now() - at < CACHE_TTL_MS ? data : null;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // Storage unavailable (private mode) — the badge simply refetches later.
  }
}

async function fetchMeta() {
  const headers = { Accept: "application/vnd.github+json" };

  const [repoRes, releaseRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.name}`, {
      headers,
    }),
    // `per_page=1` plus the empty-array response means "no releases yet",
    // which is exactly the state this is designed to handle.
    fetch(
      `https://api.github.com/repos/${REPO.owner}/${REPO.name}/releases?per_page=1`,
      {
        headers,
      },
    ),
  ]);

  if (!repoRes.ok) throw new Error(`GitHub responded ${repoRes.status}`);

  const repo = await repoRes.json();
  const releases = releaseRes.ok ? await releaseRes.json() : [];

  return {
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    // No release → null → the badge is hidden, per the release-gating rule.
    version:
      Array.isArray(releases) && releases[0]?.tag_name
        ? releases[0].tag_name
        : null,
  };
}

const IconBadge = ({ href, icon: Icon, value, label, srLabel }) => {
  if (value === null) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={srLabel}
      title={srLabel}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium tabular-nums",
        "text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon size={14} className="shrink-0" />
      {value}
      <span className="sr-only">{label}</span>
    </a>
  );
};

/**
 * Repo link plus live stars / forks / version.
 *
 * `showVersion` is left configurable so the badge can be suppressed entirely
 * without editing this component — useful if the star/fork counters are wanted
 * but the release feed is not.
 */
export function RepoBadges({ showVersion = true, className }) {
  const [meta, setMeta] = useState(readCache);

  useEffect(() => {
    if (meta) return;

    let cancelled = false;

    fetchMeta()
      .then((data) => {
        if (cancelled) return;
        writeCache(data);
        setMeta(data);
      })
      .catch(() => {
        // Offline, rate-limited, or the repo is private. Hide the counters.
        // A docs header is not the place to report an API failure.
      });

    return () => {
      cancelled = true;
    };
  }, [meta]);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <IconBadge
        href={REPO.url}
        icon={GitHubIcon}
        value="Source"
        srLabel={`View the ${REPO.name} source on GitHub`}
      />

      {meta && (
        <>
          <IconBadge
            href={`${REPO.url}/stargazers`}
            icon={Star}
            value={meta.stars.toLocaleString()}
            label="stars"
            srLabel={`${meta.stars} stars on GitHub`}
          />
          <IconBadge
            href={`${REPO.url}/forks`}
            icon={GitFork}
            value={meta.forks.toLocaleString()}
            label="forks"
            srLabel={`${meta.forks} forks on GitHub`}
          />
        </>
      )}

      {showVersion && meta?.version && (
        <IconBadge
          href={`${REPO.url}/releases/tag/${meta.version}`}
          icon={Tag}
          value={meta.version}
          label="latest release"
          srLabel={`Latest release ${meta.version}`}
        />
      )}
    </div>
  );
}

export { FALLBACK_VERSION };

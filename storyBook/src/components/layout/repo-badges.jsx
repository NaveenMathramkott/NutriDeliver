import { GitFork, Star, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { FALLBACK_VERSION, REPO } from "../../lib/repo";
import { GitHubIcon } from "../icons";
import { cn } from "../../lib/utils";

// unauthenticated api, rate-limited — every failure path just hides a badge
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
    // private mode blocks storage, we just refetch later
  }
}

async function fetchMeta() {
  const headers = { Accept: "application/vnd.github+json" };

  const [repoRes, releaseRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.name}`, {
      headers,
    }),
    // per_page=1 plus an empty array means "no releases yet", which we handle
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
    // no release -> null -> badge stays hidden
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

// showVersion is toggleable so you can drop the release feed
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
        // offline or private repo — a header is no place for an API error
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

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { flatPages, getPage } from "../../lib/navigation";
import { REPO } from "../../lib/repo";
import { RepoBadges } from "../layout/repo-badges";
import { Toc } from "../layout/toc";
import { DocsContent } from "./docs-content";
import { ErrorBoundary } from "./error-boundary";

// scan the rendered dom so split and eager chapters behave alike
function useHeadings(containerRef, slug) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function scan() {
      const next = [];

      for (const el of container.querySelectorAll("h2, h3")) {
        if (!el.id) {
          const base =
            (el.textContent ?? "")
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .trim()
              .replace(/\s+/g, "-") || "section";

          // "setup" appears in two sections, so ids need a suffix
          let id = base;
          let n = 2;
          while (container.querySelector(`#${CSS.escape(id)}`))
            id = `${base}-${n++}`;

          el.id = id;
        }

        next.push({
          id: el.id,
          text: el.textContent ?? "",
          level: el.tagName === "H2" ? 2 : 3,
        });
      }

      setHeadings(next);
    }

    scan();

    const observer = new MutationObserver(scan);
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [slug, containerRef]);

  return headings;
}

// body, toc and prev/next pager
export function DocPage() {
  // splat route, so slugs containing slashes arrive under `*`
  const params = useParams();
  const slug = params["*"] ?? "";
  const page = getPage(slug);

  const contentRef = useRef(null);
  const headings = useHeadings(contentRef, slug);

  // browser restores the old offset otherwise
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    document.title = page
      ? `${page.title} · NutriDeliver Build Guide`
      : "Page not found · NutriDeliver";
  }, [page]);

  if (!page) return <NotFound slug={slug} />;

  return (
    <div className="flex gap-10 px-4 lg:px-8">
      <article className="min-w-0 flex-1 py-10">
        <Breadcrumbs section={page.section} title={page.title} />

        <div className="prose-docs max-w-3xl" ref={contentRef}>
          <h1 className="mt-0 mb-3 scroll-mt-24 text-[2.1rem] leading-[1.15] font-bold tracking-tight">
            {page.title}
          </h1>
          <p className="mt-0 mb-8 text-lg leading-relaxed text-muted-foreground">
            {page.description}
          </p>
          <ErrorBoundary resetKey={slug}>
            <DocsContent slug={slug} />
          </ErrorBoundary>
        </div>

        <PagePager slug={slug} />
        <Footer />
      </article>

      <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-60 shrink-0 overflow-y-auto py-10 xl:block">
        <Toc headings={headings} />
      </aside>
    </div>
  );
}

function Breadcrumbs({ section, title }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
      <ol className="flex items-center gap-1.5">
        <li>
          <Link to="/" className="hover:text-foreground">
            Docs
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>{section}</li>
        <li aria-hidden="true">/</li>
        <li className="max-w-[16rem] truncate text-foreground">{title}</li>
      </ol>
    </nav>
  );
}

function PagePager({ slug }) {
  const i = flatPages.findIndex((p) => p.slug === slug);
  const prev = i > 0 ? flatPages[i - 1] : null;
  const next = i > -1 && i < flatPages.length - 1 ? flatPages[i + 1] : null;

  if (!prev && !next) return null;
  const href = (p) => (p.slug === "" ? "/" : `/docs/${p.slug}`);

  return (
    <nav className="mt-14 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
      {prev ? (
        <Link
          to={href(prev)}
          className="group flex flex-col rounded-lg border border-border px-4 py-3 transition-colors hover:bg-accent/50"
        >
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowLeft
              size={12}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Previous
          </span>
          <span className="mt-1 text-sm font-medium">{prev.title}</span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}

      {next && (
        <Link
          to={href(next)}
          className="group flex flex-col rounded-lg border border-border px-4 py-3 text-right transition-colors hover:bg-accent/50 sm:ml-auto"
        >
          <span className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
            Next
            <ArrowRight
              size={12}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
          <span className="mt-1 text-sm font-medium">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-border pt-6">
      <p className="text-xs leading-relaxed text-muted-foreground">
        NutriDeliver is an open reference implementation of an industrial-grade
        food delivery platform. Feel free to{" "}
        <a
          href={REPO.url}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline underline-offset-2"
        >
          fork it on GitHub
        </a>{" "}
        and adapt it to your own projects.
      </p>
      <div className="mt-4">
        <RepoBadges showVersion={false} />
      </div>
    </footer>
  );
}

function NotFound({ slug }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <p className="font-mono text-sm text-brand">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        We could not find{" "}
        <code className="font-mono text-sm">/docs/{slug}</code> in this guide.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Back to the overview
      </Link>
    </div>
  );
}

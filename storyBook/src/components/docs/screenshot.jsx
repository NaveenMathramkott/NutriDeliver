import { ExternalLink, ImageOff } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

/**
 * A screenshot of a real screen from the built application.
 *
 * Rendered inside a device-style frame rather than as a bare image, because
 * these are full-page captures with a fixed dark UI. The frame gives them a
 * consistent crop and keeps the dark screenshots from bleeding into the page
 * background in light mode.
 *
 * `alt` is required — a screenshot is meaningless to a screen reader without a
 * description of what it shows, so it is not optional here.
 */
export function Screenshot({
  src,
  alt,
  caption,
  href,
  className,
  width = 1600,
  height = 1000,
}) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className={cn("my-7", className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Chrome bar: purely decorative, so hidden from assistive tech. */}
        <div
          aria-hidden="true"
          className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-3 py-2"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/50" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
          <span className="ml-2 font-mono text-[10px] tracking-wide text-muted-foreground/70">
            nutrideliver.com
          </span>
        </div>

        {failed ? (
          <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 bg-muted/30 px-6 text-center">
            <ImageOff size={20} className="text-muted-foreground" />
            <p className="m-0 text-sm text-muted-foreground">
              Screenshot unavailable
            </p>
          </div>
        ) : (
          <a
            href={href ?? src}
            target="_blank"
            rel="noreferrer"
            className="group block"
            tabIndex={-1}
            aria-hidden="true"
          >
            <img
              src={src}
              alt={alt}
              width={width}
              height={height}
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              className="block w-full transition-opacity group-hover:opacity-95"
            />
          </a>
        )}
      </div>

      {caption && (
        <figcaption className="mt-2.5 flex items-start gap-1.5 text-sm leading-relaxed text-muted-foreground">
          <span>{caption}</span>
          <ExternalLink size={12} className="mt-1.5 shrink-0 opacity-60" />
        </figcaption>
      )}
    </figure>
  );
}

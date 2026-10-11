import { cn } from "../../lib/utils";

/**
 * Numbered workflow steps. Each step is rendered as a connected rail, so a
 * multi-part build sequence reads as one continuous instruction rather than a
 * stack of disconnected code blocks.
 */
export function Steps({ children }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <ol className="my-6 ml-4 border-l border-border pl-8">
      {items.map((child, i) => (
        <li key={i} className="relative [&>*:first-child]:mt-0">
          <span className="absolute top-1 -left-[2.42rem] flex size-7 items-center justify-center rounded-full border border-border bg-muted font-mono text-xs font-medium text-muted-foreground">
            {i + 1}
          </span>
          {child}
        </li>
      ))}
    </ol>
  );
}

export function Step({ title, children, className }) {
  return (
    <div className={cn("mb-4", className)}>
      {title && <p className="mt-0 mb-2 font-semibold">{title}</p>}
      <div className="[&>*:first-child]:mt-0">{children}</div>
    </div>
  );
}

/**
 * A grid of cards linking to other pages in the guide.
 */
export function CardGrid({ children }) {
  return <div className="my-6 grid gap-3 sm:grid-cols-2">{children}</div>;
}

export function Card({ href, title, description, icon: Icon }) {
  const Wrapper = href ? "a" : "div";
  return (
    <Wrapper
      href={href}
      className={cn(
        "group flex flex-col gap-1.5 rounded-lg border border-border bg-card p-4 transition-colors",
        href && "hover:border-ring/60 hover:bg-accent/40",
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-brand" />}
        <span className="font-medium">{title}</span>
      </div>
      {description && (
        <p className="m-0 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </Wrapper>
  );
}

/** Key/value grid, useful for environment variables and status codes. */
export function PropertyTable({
  rows,
  headers = ["Name", "Type", "Description"],
}) {
  return (
    <div className="my-5 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="border-b border-border px-3.5 py-2.5 text-left font-medium text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="transition-colors hover:bg-muted/30">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="border-b border-border px-3.5 py-2.5 align-top last:border-0"
                >
                  {j === 0 ? (
                    <span className="font-mono text-[0.82rem] text-foreground">
                      {cell}
                    </span>
                  ) : j === 1 ? (
                    <span className="font-mono text-[0.82rem] text-brand">
                      {cell}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{cell}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Renders an ASCII/flow diagram in a monospace block that scrolls. */
export function Diagram({ children, caption }) {
  return (
    <figure className="my-6">
      <pre className="overflow-x-auto rounded-lg border border-border bg-surface px-4 py-4 font-mono text-[12.5px] leading-[1.65]">
        {children}
      </pre>
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Side-by-side comparison of two approaches. */
export function Split({ left, right }) {
  return (
    <div className="my-6 grid gap-4 md:grid-cols-2">
      {left && (
        <div className="rounded-lg border border-border bg-card p-4">
          {left.title && (
            <p className="mt-0 mb-2 font-semibold">{left.title}</p>
          )}
          <div className="text-sm text-muted-foreground [&>*:first-child]:mt-0">
            {left.children}
          </div>
        </div>
      )}
      {right && (
        <div className="rounded-lg border border-border bg-card p-4">
          {right.title && (
            <p className="mt-0 mb-2 font-semibold">{right.title}</p>
          )}
          <div className="text-sm text-muted-foreground [&>*:first-child]:mt-0">
            {right.children}
          </div>
        </div>
      )}
    </div>
  );
}

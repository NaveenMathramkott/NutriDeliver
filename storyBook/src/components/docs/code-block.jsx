import { Check, Copy } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { highlight } from "../../lib/highlight";
import { cn } from "../../lib/utils";

const LANG_LABEL = {
  js: "JavaScript",
  jsx: "JSX",
  ts: "TypeScript",
  tsx: "TSX",
  bash: "Terminal",
  shell: "Shell",
  json: "JSON",
  mongodb: "MongoDB",
  text: "Text",
};

export function CodeBlock({
  code,
  language = "bash",
  title,
  filename,
  className,
}) {
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => highlight(code, language), [code, language]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be blocked; silently ignore rather than throw.
    }
  }, [code]);

  return (
    <figure
      className={cn(
        "group relative my-5 overflow-hidden rounded-lg border border-border bg-surface",
        className,
      )}
    >
      {(title || filename) && (
        <figcaption className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2">
          <span className="font-mono text-xs text-muted-foreground">
            {title ?? filename}
          </span>
        </figcaption>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="absolute top-3 right-3 z-10 rounded-md border border-border bg-background/90 p-1.5 text-muted-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-foreground"
        >
          {copied ? (
            <Check size={14} className="text-success" />
          ) : (
            <Copy size={14} />
          )}
        </button>
        <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-[1.7]">
          <code
            className="font-mono"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </pre>
      </div>
      <span className="pointer-events-none absolute bottom-2 left-3 font-mono text-[10px] tracking-wider text-muted-foreground/50 uppercase opacity-0 transition-opacity group-hover:opacity-100">
        {LANG_LABEL[language] ?? language}
      </span>
    </figure>
  );
}

export function InlineCode({ children }) {
  return (
    <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] whitespace-nowrap">
      {children}
    </code>
  );
}

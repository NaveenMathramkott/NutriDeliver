/**
 * A small, dependency-free syntax highlighter.
 *
 * It is intentionally not a full parser. It tokenises with an ordered set of
 * regex rules (comments and strings first, keywords next, identifiers last) and
 * escapes the output before it reaches React, so code samples render correctly
 * without `dangerouslySetInnerHTML`.
 */

const KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "new",
  "class",
  "extends",
  "super",
  "this",
  "import",
  "from",
  "export",
  "default",
  "async",
  "await",
  "try",
  "catch",
  "finally",
  "throw",
  "typeof",
  "instanceof",
  "in",
  "of",
  "delete",
  "void",
  "yield",
  "static",
  "get",
  "set",
  "interface",
  "type",
  "enum",
  "implements",
  "public",
  "private",
  "protected",
  "readonly",
  "satisfies",
  "keyof",
  "declare",
  "as",
  "null",
  "undefined",
  "true",
  "false",
]);

const LITERALS = new Set([
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity",
  "this",
  "super",
]);

const BUILTINS = new Set([
  "console",
  "Math",
  "JSON",
  "Object",
  "Array",
  "String",
  "Number",
  "Boolean",
  "Promise",
  "Map",
  "Set",
  "Date",
  "RegExp",
  "Error",
  "Symbol",
  "BigInt",
  "document",
  "window",
  "process",
  "require",
  "module",
  "exports",
]);

const escapeHtml = (str) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function tokenize(code, language) {
  const rules = [
    ["comment", /\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*/],
    ["string", /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/],
    ["number", /\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b/i],
    ["function", /\b[A-Za-z_$][\w$]*(?=\s*\()/],
    ["operator", /[+\-*/%=<>!&|^~?:]+/],
    ["punctuation", /[{}[\]();,.]/],
    ["plain", /[A-Za-z_$][\w$-]*/],
    ["whitespace", /\s+/],
    ["other", /[^A-Za-z0-9_$\s{}[\]();,."'`]/],
  ];

  const isShell = language === "bash" || language === "shell";
  const out = [];
  let rest = code;
  let guard = 0;

  while (rest.length > 0 && guard++ < 20000) {
    let matched = false;

    for (const [type, regex] of rules) {
      const m = rest.match(regex);
      if (!m || m.index !== 0) continue;

      const text = m[0];
      let cls;

      switch (type) {
        case "comment":
          cls = "tok-comment";
          break;
        case "string":
          cls = "tok-string";
          break;
        case "number":
          cls = "tok-number";
          break;
        case "function":
          cls = "tok-function";
          break;
        case "operator":
          cls = "tok-operator";
          break;
        case "punctuation":
          cls = "tok-punct";
          break;
        case "whitespace":
          cls = null;
          break;
        case "plain": {
          if (LITERALS.has(text)) cls = "tok-literal";
          else if (isShell && /^[A-Z][A-Z0-9_]*$/.test(text))
            cls = "tok-literal";
          else if (isShell) cls = "tok-command";
          else if (KEYWORDS.has(text)) cls = "tok-keyword";
          else if (BUILTINS.has(text)) cls = "tok-builtin";
          else if (/^[A-Z]/.test(text)) cls = "tok-type";
          else if (text.startsWith("-")) cls = "tok-attr";
          else cls = "tok-ident";
          break;
        }
        default:
          cls = "tok-other";
      }

      if (cls) {
        out.push(`<span class="${cls}">${escapeHtml(text)}</span>`);
      } else {
        out.push(escapeHtml(text));
      }
      rest = rest.slice(text.length);
      matched = true;
      break;
    }

    if (!matched) {
      out.push(escapeHtml(rest[0]));
      rest = rest.slice(1);
    }
  }

  return out.join("");
}

/** Returns highlighted HTML for a code sample. Safe to inject. */
export function highlight(code, language) {
  return tokenize(String(code).replace(/\n$/, ""), language);
}

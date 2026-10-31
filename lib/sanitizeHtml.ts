/**
 * Strict allowlist sanitizer for seller-written product descriptions (rich-text editor output).
 * Keeps basic formatting tags with NO attributes; drops everything else (scripts, handlers,
 * links, images, styles). Text is re-escaped, so stray "<" can never become markup.
 */
const ALLOWED = new Set([
  "p", "div", "br", "b", "strong", "i", "em", "u", "s",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "blockquote", "span",
]);

const DROP_WITH_CONTENT =
  /<(script|style|iframe|object|embed|template|noscript|textarea|select|svg|math|title|head)\b[\s\S]*?<\/\1\s*>/gi;

const TAG = /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

function escapeText(text: string) {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function sanitizeDescriptionHtml(html: string | null | undefined): string {
  if (!html) return "";
  const input = html.replace(DROP_WITH_CONTENT, "").replace(/<!--[\s\S]*?-->/g, "");
  let out = "";
  let last = 0;
  for (const m of input.matchAll(TAG)) {
    out += escapeText(input.slice(last, m.index));
    last = (m.index ?? 0) + m[0].length;
    const closing = m[1] === "/";
    const name = m[2].toLowerCase();
    if (!ALLOWED.has(name)) continue;
    if (name === "br") {
      if (!closing) out += "<br>";
      continue;
    }
    out += closing ? `</${name}>` : `<${name}>`;
  }
  out += escapeText(input.slice(last));
  return out;
}

/** Plain text (for meta descriptions / JSON-LD). */
export function htmlToPlainText(html: string | null | undefined): string {
  return sanitizeDescriptionHtml(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

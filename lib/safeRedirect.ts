/**
 * Only same-site relative paths are allowed as post-login destinations.
 * Rejects absolute URLs ("https://evil.com"), protocol-relative ("//evil.com") and
 * backslash tricks ("/\evil.com") so a crafted ?next= link can't bounce users off-site.
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/profile"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  // Control characters / whitespace can smuggle a different target past some parsers.
  if (/[\u0000-\u001f\u007f\s]/.test(raw)) return fallback;
  return raw;
}

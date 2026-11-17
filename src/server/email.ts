/** Canonical form for allowlist lookup, rate limits, sessions, and usage keys. */
export function normalizeEmail(raw: string): string {
  return raw
    .trim()
    .replace(/^<|>$/g, "")
    .normalize("NFKC")
    .toLowerCase();
}
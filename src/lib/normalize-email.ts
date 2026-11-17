/** Canonical form for allowlist lookup (shared by API and login form). */
export function normalizeEmail(raw: string): string {
  return raw
    .trim()
    .replace(/^<|>$/g, "")
    .normalize("NFKC")
    .toLowerCase();
}
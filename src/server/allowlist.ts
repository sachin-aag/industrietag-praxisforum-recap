import "server-only";
import { redis } from "./redis";
import { env } from "./env";

/** Redis set holding the registered attendees (lower-cased emails). Manage it with `npm run allowlist`. */
export const ALLOWLIST_KEY = "pf:allowlist";

export const normalizeEmail = (e: string) => e.trim().replace(/^<|>$/g, "").toLowerCase();

/**
 * An address may sign in if it is in the Redis allowlist. ALLOWED_EMAILS (env) still works as an
 * optional extra/fallback, e.g. for admins or if Redis is unreachable.
 */
export async function isAllowed(email: string): Promise<boolean> {
  const e = normalizeEmail(email);
  if (env.allowedEmails().has(e)) return true;
  try {
    const [hit] = await redis([["SISMEMBER", ALLOWLIST_KEY, e]]);
    return Number(hit) === 1;
  } catch (err) {
    console.error("[allowlist] lookup failed", err);
    return false;
  }
}

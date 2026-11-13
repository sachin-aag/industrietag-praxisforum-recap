import "server-only";

// Best-effort, per-instance limiter. Good enough for a small allowlisted audience;
// swap for Upstash Ratelimit if the attendee list grows.
const buckets = new Map<string, number[]>();

export function hit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

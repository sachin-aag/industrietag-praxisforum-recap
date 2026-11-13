import "server-only";

// Minimal Upstash Redis client over its REST API (no dependency).

// The Vercel integration may add a custom prefix (this project uses SCHETTER_).
const pick = (...names: string[]) => names.map((n) => process.env[n]).find(Boolean);
const redisUrl = () => pick("UPSTASH_REDIS_REST_URL", "KV_REST_API_URL", "SCHETTER_KV_REST_API_URL");
const redisToken = () => pick("UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN", "SCHETTER_KV_REST_API_TOKEN");

export class UsageStoreMissing extends Error {}

export const redisConfigured = () => Boolean(redisUrl() && redisToken());

// Local development fallback only (counters and sets, enough for usage + allowlist).
const g = globalThis as { __pfMem?: Map<string, number>; __pfSets?: Map<string, Set<string>> };
const memory = (g.__pfMem ??= new Map<string, number>());
const sets = (g.__pfSets ??= new Map<string, Set<string>>());

type Result = number | string | null | string[];

export async function redis(commands: (string | number)[][]): Promise<Result[]> {
  const url = redisUrl();
  const token = redisToken();
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") throw new UsageStoreMissing("Upstash Redis is not configured");
    return commands.map(([cmd, key, ...args]) => {
      const k = String(key);
      const set = sets.get(k) ?? new Set<string>();
      switch (cmd) {
        case "GET":
          return memory.get(k) ?? null;
        case "SISMEMBER":
          return set.has(String(args[0])) ? 1 : 0;
        case "SMEMBERS":
          return [...set];
        case "SADD":
          args.forEach((a) => set.add(String(a)));
          sets.set(k, set);
          return args.length;
        default: {
          const next = (memory.get(k) ?? 0) + (cmd === "INCRBY" ? Number(args[0]) : cmd === "DECR" ? -1 : 1);
          memory.set(k, next);
          return next;
        }
      }
    });
  }
  const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}: ${await res.text()}`);
  const out = (await res.json()) as { result?: Result; error?: string }[];
  return out.map((r) => {
    if (r.error) throw new Error(`Upstash: ${r.error}`);
    return r.result ?? null;
  });
}

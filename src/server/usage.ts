import "server-only";

// Lifetime usage per attendee (questions + tokens), stored in Upstash Redis via its REST API.
// Vercel's Upstash integration sets KV_REST_API_URL / KV_REST_API_TOKEN; plain Upstash uses UPSTASH_REDIS_REST_*.

export const limits = {
  queries: () => Number(process.env.CHAT_MAX_QUERIES || 100),
  tokens: () => Number(process.env.CHAT_MAX_TOKENS || 2_500_000),
};

export type Usage = { queries: number; tokens: number; maxQueries: number; maxTokens: number };

const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export class UsageStoreMissing extends Error {}

// Local development fallback only.
const g = globalThis as { __pfUsage?: Map<string, number> };
const memory = (g.__pfUsage ??= new Map<string, number>());

async function redis(commands: (string | number)[][]): Promise<(number | string | null)[]> {
  const url = redisUrl();
  const token = redisToken();
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") throw new UsageStoreMissing("Upstash Redis is not configured");
    return commands.map(([cmd, key, arg]) => {
      const k = String(key);
      if (cmd === "GET") return memory.get(k) ?? null;
      const next = (memory.get(k) ?? 0) + (cmd === "INCRBY" ? Number(arg) : cmd === "DECR" ? -1 : 1);
      memory.set(k, next);
      return next;
    });
  }
  const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}: ${await res.text()}`);
  const out = (await res.json()) as { result?: number | string | null; error?: string }[];
  return out.map((r) => {
    if (r.error) throw new Error(`Upstash: ${r.error}`);
    return r.result ?? null;
  });
}

const keys = (email: string) => ({ q: `pf:usage:${email}:queries`, t: `pf:usage:${email}:tokens` });

export async function getUsage(email: string): Promise<Usage> {
  const k = keys(email);
  const [q, t] = await redis([["GET", k.q], ["GET", k.t]]);
  return { queries: Number(q ?? 0), tokens: Number(t ?? 0), maxQueries: limits.queries(), maxTokens: limits.tokens() };
}

/** Atomically reserves one question. Returns null if a limit is already reached. */
export async function reserveQuery(email: string): Promise<Usage | null> {
  const k = keys(email);
  const [t] = await redis([["GET", k.t]]);
  if (Number(t ?? 0) >= limits.tokens()) return null;
  const [q] = await redis([["INCR", k.q]]);
  if (Number(q) > limits.queries()) {
    await redis([["DECR", k.q]]);
    return null;
  }
  return { queries: Number(q), tokens: Number(t ?? 0), maxQueries: limits.queries(), maxTokens: limits.tokens() };
}

/** Gives the question back if the model call failed before answering. */
export async function releaseQuery(email: string) {
  await redis([["DECR", keys(email).q]]);
}

export async function addTokens(email: string, n: number) {
  if (n > 0) await redis([["INCRBY", keys(email).t, Math.round(n)]]);
}

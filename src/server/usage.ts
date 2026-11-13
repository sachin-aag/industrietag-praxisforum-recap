import "server-only";

// Lifetime usage per attendee (questions + tokens), stored in Upstash Redis.

export const limits = {
  queries: () => Number(process.env.CHAT_MAX_QUERIES || 100),
  tokens: () => Number(process.env.CHAT_MAX_TOKENS || 2_500_000),
};

export type Usage = { queries: number; tokens: number; maxQueries: number; maxTokens: number };

import { redis, UsageStoreMissing } from "./redis";

export { UsageStoreMissing };

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

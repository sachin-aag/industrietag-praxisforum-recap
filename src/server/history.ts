import "server-only";
import { redis } from "./redis";
import { normalizeEmail } from "./email";

export type HistoryMsg = { role: "user" | "assistant"; content: string };

const MAX_MESSAGES = 40;
const MAX_CONTENT = 4000;
const TTL_SECONDS = 60 * 60 * 24 * 30;

const key = (email: string) => `pf:chat:${normalizeEmail(email)}`;

function sanitize(raw: unknown): HistoryMsg[] {
  if (!Array.isArray(raw)) return [];
  const out: HistoryMsg[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;
    const trimmed = content.trim();
    if (!trimmed) continue;
    out.push({ role, content: trimmed.slice(0, MAX_CONTENT) });
  }
  return out.slice(-MAX_MESSAGES);
}

export async function getHistory(email: string): Promise<HistoryMsg[]> {
  const [raw] = await redis([["GET", key(email)]]);
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return sanitize(parsed);
    if (parsed && typeof parsed === "object" && "messages" in parsed) {
      return sanitize((parsed as { messages: unknown }).messages);
    }
  } catch {
    /* corrupt blob */
  }
  return [];
}

export async function saveHistory(email: string, messages: HistoryMsg[]): Promise<void> {
  const clean = sanitize(messages);
  if (!clean.length) return;
  await redis([["SETEX", key(email), TTL_SECONDS, JSON.stringify({ updatedAt: Date.now(), messages: clean })]]);
}

/** Append one completed Q&A without dropping older turns stored on the server. */
export async function appendTurn(email: string, userMsg: HistoryMsg, assistantMsg: HistoryMsg): Promise<void> {
  const existing = await getHistory(email);
  const last = existing.at(-1);
  const prev = existing.at(-2);
  if (prev?.role === "user" && prev.content === userMsg.content && last?.role === "assistant" && last.content === assistantMsg.content) {
    return;
  }
  await saveHistory(email, [...existing, userMsg, assistantMsg]);
}
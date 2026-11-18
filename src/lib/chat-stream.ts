/** Printable marker at the end of a chat body. Must not appear in model output we display. */
export const CHAT_STREAM_SENTINEL = "\n<<<PF_CHAT_META>>>";

/** Previous marker (ASCII RS). Some proxies strip C0 controls, which leaked the JSON trailer. */
const LEGACY_SENTINEL = "\u001e";

const META_PREFIX = '{"done":true';

export type ChatStreamMeta = {
  done: true;
  finishReason: string | null;
  chars: number;
  requestId: string;
};

export function encodeChatMeta(meta: ChatStreamMeta): string {
  return CHAT_STREAM_SENTINEL + JSON.stringify(meta);
}

export function splitChatStream(raw: string): { text: string; meta: ChatStreamMeta | null } {
  const marked = splitAtSentinel(raw, CHAT_STREAM_SENTINEL) ?? splitAtSentinel(raw, LEGACY_SENTINEL);
  if (marked) return marked;

  // Proxies may drop the sentinel and leave the JSON glued to the answer.
  const jsonAt = raw.lastIndexOf(META_PREFIX);
  if (jsonAt === -1) return { text: raw, meta: null };
  if (raw.slice(jsonAt).includes("\n")) return { text: raw, meta: null };
  return parseTrailer(raw.slice(0, jsonAt), raw.slice(jsonAt));
}

function splitAtSentinel(raw: string, sentinel: string): { text: string; meta: ChatStreamMeta | null } | null {
  const i = raw.indexOf(sentinel);
  if (i === -1) return null;
  return parseTrailer(raw.slice(0, i), raw.slice(i + sentinel.length));
}

function parseTrailer(text: string, rest: string): { text: string; meta: ChatStreamMeta | null } {
  const trimmed = rest.trim();
  if (!trimmed) return { text, meta: null };
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (isChatStreamMeta(parsed)) return { text, meta: parsed };
  } catch {
    /* trailer still arriving */
  }
  if (trimmed.startsWith(META_PREFIX)) return { text, meta: null };
  return { text: text + rest, meta: null };
}

function isChatStreamMeta(value: unknown): value is ChatStreamMeta {
  if (!value || typeof value !== "object") return false;
  const v = value as { done?: unknown; chars?: unknown; requestId?: unknown; finishReason?: unknown };
  return v.done === true && typeof v.chars === "number" && typeof v.requestId === "string";
}

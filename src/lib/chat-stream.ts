/** Marks the end of a chat body. Must not appear in model output we display. */
export const CHAT_STREAM_SENTINEL = "\u001e";

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
  const i = raw.indexOf(CHAT_STREAM_SENTINEL);
  if (i === -1) return { text: raw, meta: null };
  const text = raw.slice(0, i);
  try {
    const parsed: unknown = JSON.parse(raw.slice(i + 1));
    if (isChatStreamMeta(parsed)) return { text, meta: parsed };
  } catch {
    /* trailer still arriving */
  }
  return { text, meta: null };
}

function isChatStreamMeta(value: unknown): value is ChatStreamMeta {
  if (!value || typeof value !== "object") return false;
  const v = value as { done?: unknown; chars?: unknown; requestId?: unknown; finishReason?: unknown };
  return v.done === true && typeof v.chars === "number" && typeof v.requestId === "string";
}
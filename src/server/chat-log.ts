import "server-only";
import { createHash, randomUUID } from "node:crypto";

type Level = "log" | "warn" | "error";

function write(level: Level, event: string, fields: Record<string, unknown>) {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, ...fields });
  console[level](line);
}

export function newChatRequestId() {
  return randomUUID();
}

/** Stable short id for correlating logs without storing the raw email. */
export function hashAttendee(email: string) {
  return createHash("sha256").update(email).digest("hex").slice(0, 12);
}

export function errFields(err: unknown): Record<string, unknown> {
  if (err instanceof Error) return { name: err.name, message: err.message };
  return { message: String(err) };
}

export const chatLog = {
  info(event: string, fields: Record<string, unknown> = {}) {
    write("log", event, fields);
  },
  warn(event: string, fields: Record<string, unknown> = {}) {
    write("warn", event, fields);
  },
  error(event: string, fields: Record<string, unknown> = {}, err?: unknown) {
    write("error", event, err === undefined ? fields : { ...fields, ...errFields(err) });
  },
};
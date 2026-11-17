import "server-only";

export type OpenRouterDelta = {
  text: string;
  finishReason?: string;
  nativeFinishReason?: string;
  totalTokens?: number;
  error?: string;
};

type Choice = {
  delta?: { content?: unknown };
  finish_reason?: string | null;
  native_finish_reason?: string | null;
};

function contentToString(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") return part.text;
      return "";
    })
    .join("");
}

function errorMessage(json: unknown): string | undefined {
  if (!json || typeof json !== "object" || !("error" in json)) return undefined;
  const err = (json as { error: unknown }).error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") return err.message;
  return "upstream_error";
}

/** Incremental parser for OpenRouter chat-completion SSE (`data: {json}\\n\\n`). */
export class OpenRouterSseParser {
  private buffer = "";
  parseErrors = 0;

  push(chunk: string, end = false): OpenRouterDelta[] {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);
    if (end) this.buffer = "";
    else this.buffer = lines.pop() ?? "";
    const out: OpenRouterDelta[] = [];
    for (const line of lines) {
      const delta = this.consumeLine(line);
      if (delta) out.push(delta);
    }
    return out;
  }

  flush(): OpenRouterDelta[] {
    return this.push("", true);
  }

  private consumeLine(line: string): OpenRouterDelta | null {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(":")) return null;
    if (!trimmed.startsWith("data:")) return null;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") return null;
    try {
      const json: unknown = JSON.parse(payload);
      const err = errorMessage(json);
      if (err) return { text: "", error: err };
      if (!json || typeof json !== "object") return null;
      const obj = json as { choices?: Choice[]; usage?: { total_tokens?: number } };
      const choice = obj.choices?.[0];
      const text = contentToString(choice?.delta?.content);
      const finishReason = choice?.finish_reason ?? undefined;
      const nativeFinishReason = choice?.native_finish_reason ?? undefined;
      const totalTokens = obj.usage?.total_tokens;
      if (!text && !finishReason && !totalTokens) return null;
      return {
        text,
        ...(finishReason ? { finishReason } : {}),
        ...(nativeFinishReason ? { nativeFinishReason } : {}),
        ...(typeof totalTokens === "number" ? { totalTokens } : {}),
      };
    } catch {
      this.parseErrors += 1;
      return null;
    }
  }
}
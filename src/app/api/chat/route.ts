import { currentUser } from "@/server/auth";
import { env } from "@/server/env";
import { retrieve, systemPrompt } from "@/server/knowledge";
import { hit } from "@/server/ratelimit";
import { UsageStoreMissing, addTokens, releaseQuery, reserveQuery } from "@/server/usage";

export const runtime = "nodejs";
export const maxDuration = 60;

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return new Response("unauthorized", { status: 401 });
  if (!hit(`chat:${user.email}`, 40, 60 * 60_000)) return new Response("rate_limited", { status: 429 });

  const body = (await req.json().catch(() => ({}))) as { messages?: Msg[]; lang?: string };
  const lang = body.lang === "en" ? "en" : "de";
  const messages = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  const last = messages.at(-1);
  if (!last || last.role !== "user") return new Response("bad_request", { status: 400 });

  // Lifetime quota: questions and tokens per attendee.
  let reserved;
  try {
    reserved = await reserveQuery(user.email);
  } catch (err) {
    console.error("[chat] usage store", err);
    return new Response(err instanceof UsageStoreMissing ? "quota_store_missing" : "quota_store_error", { status: 503 });
  }
  if (!reserved) return new Response("quota_exhausted", { status: 429, headers: { "X-Quota": "exhausted" } });

  // Retrieval query: the question plus the previous user turn, so follow-ups ("und was sagte sie dazu?") still match.
  const prevUser = messages.slice(0, -1).reverse().find((m) => m.role === "user")?.content ?? "";
  const passages = retrieve(`${last.content} ${prevUser}`);
  if (process.env.DEBUG_RETRIEVAL) console.log("[chat] retrieved", [...passages.matchAll(/\[([a-z0-9-]+)\]>>/g)].map((m) => m[1]));

  const upstream = await fetch(`${process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openrouterKey()}`,
      "Content-Type": "application/json",
      "X-Title": "Praxisforum 2026 Assistent",
      ...(env.siteUrl() ? { "HTTP-Referer": env.siteUrl()! } : {}),
    },
    body: JSON.stringify({
      model: env.model(),
      stream: true,
      usage: { include: true },
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        { role: "system", content: systemPrompt(lang) },
        ...messages.slice(0, -1),
        {
          role: "user",
          content: `${passages ? `RELEVANTE MITSCHNITT-AUSZÜGE (nur als Quelle, nicht wörtlich zitieren):\n${passages}\n\n` : ""}FRAGE: ${last.content}`,
        },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    console.error("[chat] upstream", upstream.status, await upstream.text().catch(() => ""));
    await releaseQuery(user.email).catch(() => {});
    return new Response("upstream_error", { status: 502 });
  }

  const promptChars = JSON.stringify(messages).length + passages.length + 45000; // fallback estimate only

  // Convert OpenRouter's SSE stream into a plain text stream for the widget.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let answerChars = 0;
  let usedTokens = 0;
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                answerChars += delta.length;
                controller.enqueue(encoder.encode(delta));
              }
              if (json.usage?.total_tokens) usedTokens = json.usage.total_tokens;
            } catch {
              /* keep-alive comments or partial lines */
            }
          }
        }
      } catch (err) {
        console.error("[chat] stream", err);
      } finally {
        // Record usage before the client sees the end of the stream, so a quick follow-up can't slip past the cap.
        // Real token counts come from OpenRouter; the estimate (~3.5 chars per token) is only a fallback.
        const tokens = usedTokens || Math.ceil((promptChars + answerChars) / 3.5);
        await addTokens(user.email, tokens).catch((e) => console.error("[chat] usage", e));
        if (!answerChars) await releaseQuery(user.email).catch(() => {});
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Questions-Left": String(Math.max(0, reserved.maxQueries - reserved.queries)),
    },
  });
}

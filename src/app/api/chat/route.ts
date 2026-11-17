import { currentUser } from "@/server/auth";
import { chatLog, hashAttendee, newChatRequestId } from "@/server/chat-log";
import { env } from "@/server/env";
import { retrieve, systemPrompt } from "@/server/knowledge";
import { hit } from "@/server/ratelimit";
import { UsageStoreMissing, addTokens, releaseQuery, reserveQuery } from "@/server/usage";

export const runtime = "nodejs";
export const maxDuration = 60;

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const requestId = newChatRequestId();
  const t0 = Date.now();
  const user = await currentUser();
  if (!user) return new Response("unauthorized", { status: 401 });
  if (!hit(`chat:${user.email}`, 40, 60 * 60_000)) return new Response("rate_limited", { status: 429 });
  const attendee = hashAttendee(user.email);

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
    chatLog.error("chat_quota_error", { requestId, attendee, ms: Date.now() - t0 }, err);
    return new Response(err instanceof UsageStoreMissing ? "quota_store_missing" : "quota_store_error", { status: 503 });
  }
  if (!reserved) return new Response("quota_exhausted", { status: 429, headers: { "X-Quota": "exhausted" } });

  // Retrieval query: the question plus the previous user turn, so follow-ups ("und was sagte sie dazu?") still match.
  const prevUser = messages.slice(0, -1).reverse().find((m) => m.role === "user")?.content ?? "";
  const tRetrieve = Date.now();
  const passages = retrieve(`${last.content} ${prevUser}`);
  const retrievalMs = Date.now() - tRetrieve;
  const retrievalSlugs = [...passages.matchAll(/\[([a-z0-9-]+)\]>>/g)].map((m) => m[1]);
  if (process.env.DEBUG_RETRIEVAL) chatLog.info("chat_retrieval_debug", { requestId, attendee, retrievalSlugs });

  const model = env.model();
  const tUpstream = Date.now();
  const upstream = await fetch(`${process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openrouterKey()}`,
      "Content-Type": "application/json",
      "X-Title": "Praxisforum 2026 Assistent",
      ...(env.siteUrl() ? { "HTTP-Referer": env.siteUrl()! } : {}),
    },
    body: JSON.stringify({
      model,
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

  const upstreamConnectMs = Date.now() - tUpstream;
  if (!upstream.ok || !upstream.body) {
    const bodyText = await upstream.text().catch(() => "");
    let upstreamMessage: string | undefined;
    try {
      const j = JSON.parse(bodyText) as { error?: { message?: string; code?: number } };
      upstreamMessage = j.error?.message;
    } catch {
      /* non-JSON body */
    }
    chatLog.error("chat_llm_upstream_error", {
      requestId,
      attendee,
      model,
      lang,
      status: upstream.status,
      upstreamMessage,
      bodyPreview: bodyText.slice(0, 400),
      ms: { total: Date.now() - t0, retrieval: retrievalMs, upstreamConnect: upstreamConnectMs },
      passageChars: passages.length,
      questionChars: last.content.length,
    });
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
  let finishReason: string | undefined;
  let streamError: unknown;
  let firstTokenMs: number | null = null;
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const tStream = Date.now();

      const consumeLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) return;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
            usage?: { total_tokens?: number };
          };
          const choice = json.choices?.[0];
          const delta = choice?.delta?.content;
          if (delta) {
            if (firstTokenMs === null) firstTokenMs = Date.now() - t0;
            answerChars += delta.length;
            controller.enqueue(encoder.encode(delta));
          }
          if (choice?.finish_reason) finishReason = choice.finish_reason;
          if (json.usage?.total_tokens) usedTokens = json.usage.total_tokens;
        } catch {
          /* keep-alive comments or partial lines */
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (value) buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split("\n");
          if (done) {
            // Last chunk often ends without a trailing newline; dropping `buffer` here cut answers off mid-sentence.
            buffer = "";
            for (const line of lines) consumeLine(line);
            break;
          }
          buffer = lines.pop() ?? "";
          for (const line of lines) consumeLine(line);
        }
      } catch (err) {
        streamError = err;
        chatLog.error("chat_llm_stream_error", { requestId, attendee, model, lang, answerChars }, err);
      } finally {
        const streamMs = Date.now() - tStream;
        const totalMs = Date.now() - t0;
        // Record usage before the client sees the end of the stream, so a quick follow-up can't slip past the cap.
        // Real token counts come from OpenRouter; the estimate (~3.5 chars per token) is only a fallback.
        const tokens = usedTokens || Math.ceil((promptChars + answerChars) / 3.5);
        await addTokens(user.email, tokens).catch((e) => chatLog.error("chat_usage_error", { requestId, attendee }, e));

        const ok = !streamError && answerChars > 0 && finishReason !== "length";
        const summary = {
          requestId,
          attendee,
          model,
          lang,
          ok,
          finishReason,
          answerChars,
          tokens,
          tokensReported: usedTokens > 0,
          passageChars: passages.length,
          questionChars: last.content.length,
          historyTurns: messages.length,
          ms: {
            total: totalMs,
            retrieval: retrievalMs,
            upstreamConnect: upstreamConnectMs,
            firstToken: firstTokenMs,
            stream: streamMs,
          },
        };

        if (streamError) {
          chatLog.error("chat_llm_done", { ...summary, outcome: "stream_error" });
        } else if (finishReason === "length") {
          chatLog.error("chat_llm_done", { ...summary, outcome: "truncated_max_tokens" });
        } else if (!answerChars) {
          chatLog.warn("chat_llm_done", { ...summary, outcome: "empty_answer" });
        } else if (finishReason && finishReason !== "stop") {
          chatLog.warn("chat_llm_done", { ...summary, outcome: "unusual_finish" });
        } else {
          chatLog.info("chat_llm_done", { ...summary, outcome: "ok" });
        }

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
      "X-Request-Id": requestId,
    },
  });
}

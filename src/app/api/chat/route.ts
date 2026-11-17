import { after } from "next/server";
import { currentUser } from "@/server/auth";
import { chatLog, hashAttendee, newChatRequestId } from "@/server/chat-log";
import { env } from "@/server/env";
import { retrieve, systemPrompt } from "@/server/knowledge";
import { OpenRouterSseParser } from "@/server/openrouter-sse";
import { hit } from "@/server/ratelimit";
import { appendTurn } from "@/server/history";
import { UsageStoreMissing, addTokens, releaseQuery, reserveQuery } from "@/server/usage";
import { encodeChatMeta } from "@/lib/chat-stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Msg = { role: "user" | "assistant"; content: string };
type LlmOutcome = "stream_error" | "upstream_error" | "truncated_max_tokens" | "empty_answer" | "unusual_finish" | "ok";

function llmOutcome(args: {
  streamError: unknown;
  upstreamError?: string;
  finishReason?: string;
  answerChars: number;
}): LlmOutcome {
  if (args.streamError) return "stream_error";
  if (args.upstreamError) return "upstream_error";
  if (args.finishReason === "length") return "truncated_max_tokens";
  if (!args.answerChars) return "empty_answer";
  if (args.finishReason && args.finishReason !== "stop") return "unusual_finish";
  return "ok";
}

function logLlmDone(outcome: LlmOutcome, summary: Record<string, unknown>) {
  switch (outcome) {
    case "ok":
      chatLog.info("chat_llm_done", summary);
      return;
    case "empty_answer":
    case "unusual_finish":
      chatLog.warn("chat_llm_done", summary);
      return;
    case "stream_error":
    case "upstream_error":
    case "truncated_max_tokens":
      chatLog.error("chat_llm_done", summary);
      return;
    default: {
      const _: never = outcome;
      return _;
    }
  }
}

export async function POST(req: Request) {
  const requestId = newChatRequestId();
  const t0 = Date.now();
  const user = await currentUser();
  if (!user) return new Response("unauthorized", { status: 401 });
  // Do not cookies().set() here: mutating cookies on a streaming route can buffer/cut off the body on Vercel.
  // Sliding expiry is refreshed by GET /api/auth/me when the widget opens.
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

  const model = env.model();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));
      const tRetrieve = Date.now();
      const prevUser = messages.slice(0, -1).reverse().find((m) => m.role === "user")?.content ?? "";
      const passages = retrieve(`${last.content} ${prevUser}`);
      const retrievalMs = Date.now() - tRetrieve;
      const retrievalSlugs = [...passages.matchAll(/\[([a-z0-9-]+)\]>>/g)].map((m) => m[1]);
      if (process.env.DEBUG_RETRIEVAL) chatLog.info("chat_retrieval_debug", { requestId, attendee, retrievalSlugs });

      const promptChars = JSON.stringify(messages).length + passages.length + 45000;
      const tUpstream = Date.now();
      let upstreamConnectMs = 0;
      let streamMs = 0;
      let answerChars = 0;
      let answerText = "";
      let usedTokens = 0;
      let finishReason: string | undefined;
      let nativeFinishReason: string | undefined;
      let streamError: unknown;
      let firstTokenMs: number | null = null;
      let sseParseErrors = 0;
      let upstreamError: string | undefined;

      try {
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
        upstreamConnectMs = Date.now() - tUpstream;

        if (!upstream.ok || !upstream.body) {
          const bodyText = await upstream.text().catch(() => "");
          try {
            const j = JSON.parse(bodyText) as { error?: { message?: string } };
            upstreamError = j.error?.message;
          } catch {
            upstreamError = bodyText.slice(0, 200) || `HTTP ${upstream.status}`;
          }
          chatLog.error("chat_llm_upstream_error", {
            requestId,
            attendee,
            model,
            lang,
            status: upstream.status,
            upstreamMessage: upstreamError,
            bodyPreview: bodyText.slice(0, 400),
            ms: { total: Date.now() - t0, retrieval: retrievalMs, upstreamConnect: upstreamConnectMs },
            passageChars: passages.length,
            questionChars: last.content.length,
          });
        } else {
          const decoder = new TextDecoder();
          const parser = new OpenRouterSseParser();
          const reader = upstream.body.getReader();
          const tStream = Date.now();
          try {
            while (true) {
              const { done, value } = await reader.read();
              const piece = value ? decoder.decode(value, { stream: !done }) : "";
              const events = parser.push(piece, done);
              for (const ev of events) {
                if (ev.error) {
                  upstreamError = ev.error;
                  chatLog.error("chat_llm_sse_error", { requestId, attendee, model, message: ev.error, answerChars });
                  continue;
                }
                if (ev.text) {
                  if (firstTokenMs === null) firstTokenMs = Date.now() - t0;
                  answerChars += ev.text.length;
                  answerText += ev.text;
                  send(ev.text);
                }
                if (ev.finishReason) finishReason = ev.finishReason;
                if (ev.nativeFinishReason) nativeFinishReason = ev.nativeFinishReason;
                if (ev.totalTokens) usedTokens = ev.totalTokens;
              }
              if (done) break;
            }
          } finally {
            streamMs = Date.now() - tStream;
            sseParseErrors = parser.parseErrors;
          }
        }
      } catch (err) {
        streamError = err;
        chatLog.error("chat_llm_stream_error", { requestId, attendee, model, lang, answerChars }, err);
      } finally {
        const tokens = usedTokens || Math.ceil((promptChars + answerChars) / 3.5);
        const outcome = llmOutcome({ streamError, upstreamError, finishReason, answerChars });
        const summary = {
          requestId,
          attendee,
          model,
          lang,
          ok: outcome === "ok",
          outcome,
          finishReason,
          nativeFinishReason,
          upstreamError,
          sseParseErrors,
          answerChars,
          tokens,
          tokensReported: usedTokens > 0,
          passageChars: passages.length,
          questionChars: last.content.length,
          historyTurns: messages.length,
          ms: {
            total: Date.now() - t0,
            retrieval: retrievalMs,
            upstreamConnect: upstreamConnectMs,
            firstToken: firstTokenMs,
            stream: streamMs,
          },
        };
        logLlmDone(outcome, summary);

        if (answerChars) {
          send(encodeChatMeta({ done: true, finishReason: finishReason ?? null, chars: answerChars, requestId }));
        }

        after(async () => {
          if (answerChars) {
            await addTokens(user.email, tokens).catch((e) => chatLog.error("chat_usage_error", { requestId, attendee }, e));
            await appendTurn(user.email, { role: "user", content: last.content }, { role: "assistant", content: answerText }).catch((e) =>
              chatLog.error("chat_history_error", { requestId, attendee }, e)
            );
          } else await releaseQuery(user.email).catch(() => {});
        });

        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store",
      "X-Accel-Buffering": "no",
      "X-Content-Type-Options": "nosniff",
      "X-Questions-Left": String(Math.max(0, reserved.maxQueries - reserved.queries)),
      "X-Request-Id": requestId,
    },
  });
}
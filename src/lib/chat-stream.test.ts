import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CHAT_STREAM_SENTINEL, encodeChatMeta, splitChatStream, type ChatStreamMeta } from "./chat-stream.ts";

const meta: ChatStreamMeta = {
  done: true,
  finishReason: "length",
  chars: 452,
  requestId: "acc0-43e0-8635-f02b469b48fe",
};

const recap = `In his talk [Vom KI-Hype](/en/beitrag/aechtler/), Michael Aechtler focused on moving from discussing AI to applying it.

Key topics included:

- **Overcoming Blockers:** AI replaces tasks rather than entire jobs.`;

describe("splitChatStream", () => {
  it("round-trips a printable sentinel trailer", () => {
    const raw = recap + encodeChatMeta(meta);
    assert.ok(raw.includes(CHAT_STREAM_SENTINEL));
    assert.deepEqual(splitChatStream(raw), { text: recap, meta });
  });

  it("strips JSON when a proxy dropped the control-character sentinel", () => {
    const leaked = recap + "\n" + JSON.stringify(meta);
    assert.deepEqual(splitChatStream(leaked), { text: recap + "\n", meta });
  });

  it("strips JSON glued directly onto the last sentence", () => {
    const leaked = recap + JSON.stringify(meta);
    assert.deepEqual(splitChatStream(leaked), { text: recap, meta });
  });

  it("still splits the legacy ASCII RS sentinel", () => {
    const raw = recap + "\u001e" + JSON.stringify(meta);
    assert.deepEqual(splitChatStream(raw), { text: recap, meta });
  });

  it("hides a partial trailer while it is still arriving", () => {
    const raw = recap + encodeChatMeta(meta).slice(0, encodeChatMeta(meta).length - 8);
    assert.deepEqual(splitChatStream(raw), { text: recap, meta: null });
  });

  it("leaves ordinary answers unchanged", () => {
    assert.deepEqual(splitChatStream(recap), { text: recap, meta: null });
  });

  it("does not treat a JSON object in the middle of a paragraph as a trailer", () => {
    const text = 'He said {"done":true} was the goal.\nThen more notes.';
    assert.deepEqual(splitChatStream(text), { text, meta: null });
  });
});

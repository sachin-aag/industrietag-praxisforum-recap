/** Normalizes flaky LLM markdown before the chat widget renders it. */
export function normalizeAssistantMarkdown(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      let s = line;
      s = s.replace(/^(\s*)\*\s*\*+\s*/, "$1- ");
      s = s.replace(/^(\s*)\*\s+(?!\*)/, "$1- ");
      s = s.replace(/\s+\*(\s*\*)?\s*$/, "");
      s = s.replace(/\*\*\s+([^*]+?)\s+\*\*/g, "**$1**");
      return s;
    })
    .join("\n");
}

export type MdBlock = { kind: "p"; text: string } | { kind: "ul"; items: string[] };

function listItemContent(line: string): string | null {
  const t = line.trim();
  const m = t.match(/^(?:[-*•]|\d+\.)\s+(.+)$/);
  return m ? m[1].trim() : null;
}

/** Splits normalized text into paragraphs and bullet lists (single-newline aware). */
export function splitMarkdownBlocks(text: string): MdBlock[] {
  const lines = normalizeAssistantMarkdown(text).split("\n");
  const blocks: MdBlock[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: "p", text: para.join(" ") });
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ kind: "ul", items: [...list] });
      list = [];
    }
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushList();
      flushPara();
      continue;
    }
    const item = listItemContent(line);
    if (item) {
      flushPara();
      list.push(item);
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushList();
  flushPara();
  return blocks;
}
/** Normalizes flaky LLM markdown before the chat widget renders it. */

/** Root-relative path, or an absolute URL whose path is on this site. */
export function internalHref(raw: string): string | null {
  let href = raw.trim().replace(/^<|>$/g, "");
  if (/^https?:\/\//i.test(href)) {
    try {
      const path = new URL(href).pathname;
      if (!/^\/(de|en)(\/|$)/.test(path)) return null;
      href = path;
    } catch {
      return null;
    }
  }
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  if (/[\s<>"'\\]/.test(href)) return null;
  return href;
}

/**
 * Collapse whitespace/newlines inside markdown links so `[title]\n(/path)` and
 * `[title] (/path)` become a single `[title](/path)` the inline parser accepts.
 */
function repairMarkdownLinks(text: string): string {
  const broken =
    /\[([^\]]+)][ \t]*(?:\r?\n[ \t]*)?\([ \t]*(?:\r?\n[ \t]*)?(?:<)?([^)\s>]+)>?[ \t]*(?:(?:"[^"]*"|'[^']*')[ \t]*)?\)/g;
  return text.replace(broken, (whole, label: string, dest: string) => {
    const href = internalHref(dest);
    if (!href) return whole;
    const cleanLabel = label.replace(/[ \t]*\r?\n[ \t]*/g, " ").replace(/[ \t]{2,}/g, " ").trim();
    return `[${cleanLabel}](${href})`;
  });
}

function unwrapBoldLinks(text: string): string {
  return text.replace(/\*\*(\[[^\]]+]\(\/[^)]+\))\*\*/g, "$1");
}

export function normalizeAssistantMarkdown(text: string): string {
  const repaired = unwrapBoldLinks(repairMarkdownLinks(text));
  return repaired
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
      continue;
    }
    if (list.length && /^(\s{2,}|\t)/.test(line)) {
      list[list.length - 1] += " " + line.trim();
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flushList();
  flushPara();
  return blocks;
}

export type InlineToken =
  | { kind: "text"; text: string }
  | { kind: "link"; href: string; children: InlineToken[] }
  | { kind: "strong"; children: InlineToken[] }
  | { kind: "em"; children: InlineToken[] };

function tokenizeMarks(s: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) tokens.push({ kind: "text", text: s.slice(last, m.index) });
    if (m[1] !== undefined) tokens.push({ kind: "strong", children: [{ kind: "text", text: m[1] }] });
    else tokens.push({ kind: "em", children: [{ kind: "text", text: m[2] }] });
    last = m.index + m[0].length;
  }
  if (last < s.length) tokens.push({ kind: "text", text: s.slice(last) });
  return tokens;
}

/** Safe inline tokens: [text](/path), **bold**, *emphasis*. Tolerates space before `(`. */
export function tokenizeInline(s: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const re = /\[([^\]]+)]\(\s*(\/[^)\s]*)\s*\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) tokens.push({ kind: "text", text: s.slice(last, m.index) });
    if (m[1] !== undefined) {
      const href = internalHref(m[2]);
      if (href) tokens.push({ kind: "link", href, children: tokenizeMarks(m[1]) });
      else tokens.push({ kind: "text", text: m[0] });
    } else if (m[3] !== undefined) {
      tokens.push({ kind: "strong", children: [{ kind: "text", text: m[3] }] });
    } else {
      tokens.push({ kind: "em", children: [{ kind: "text", text: m[4] }] });
    }
    last = m.index + m[0].length;
  }
  if (last < s.length) tokens.push({ kind: "text", text: s.slice(last) });
  return tokens;
}

export function tokenText(tokens: InlineToken[]): string {
  return tokens
    .map((t) => {
      switch (t.kind) {
        case "text":
          return t.text;
        case "link":
        case "strong":
        case "em":
          return tokenText(t.children);
        default: {
          const _: never = t;
          return _;
        }
      }
    })
    .join("");
}

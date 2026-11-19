import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  internalHref,
  normalizeAssistantMarkdown,
  splitMarkdownBlocks,
  tokenizeInline,
  tokenText,
  type InlineToken,
} from "./assistant-markdown.ts";

const WUERTH_TITLE =
  "Die Datenbasis für die Orchestrierung – wie strukturierte Bauteil- und Zonendaten KI-gesteuertes Procurement und Delivery am Bau erst möglich machen";
const WUERTH_HREF = "/de/beitrag/f1-wuerth/";

function linksIn(text: string): { href: string; label: string }[] {
  const links: { href: string; label: string }[] = [];
  const walk = (tokens: InlineToken[]) => {
    for (const t of tokens) {
      switch (t.kind) {
        case "text":
          break;
        case "link":
          links.push({ href: t.href, label: tokenText(t.children) });
          walk(t.children);
          break;
        case "strong":
        case "em":
          walk(t.children);
          break;
        default: {
          const _: never = t;
          return _;
        }
      }
    }
  };
  for (const b of splitMarkdownBlocks(text)) {
    if (b.kind === "p") walk(tokenizeInline(b.text));
    else for (const item of b.items) walk(tokenizeInline(item));
  }
  return links;
}

describe("internalHref", () => {
  it("keeps root-relative site paths", () => {
    assert.equal(internalHref("/de/beitrag/f1-wuerth/"), "/de/beitrag/f1-wuerth/");
  });

  it("extracts the path from an absolute URL on this site", () => {
    assert.equal(internalHref("https://example.de/de/beitrag/f1-wuerth/"), "/de/beitrag/f1-wuerth/");
  });

  it("rejects protocol-relative and non-site URLs", () => {
    assert.equal(internalHref("//evil.example/de/beitrag/x/"), null);
    assert.equal(internalHref("https://linkedin.com/in/someone"), null);
    assert.equal(internalHref("javascript:alert(1)"), null);
    assert.equal(internalHref("Würth"), null);
  });
});

describe("normalizeAssistantMarkdown links", () => {
  it("collapses a space between label and destination", () => {
    assert.equal(
      normalizeAssistantMarkdown(`[${WUERTH_TITLE}] (${WUERTH_HREF})`),
      `[${WUERTH_TITLE}](${WUERTH_HREF})`,
    );
  });

  it("joins a destination that landed on the next line", () => {
    const raw = `[${WUERTH_TITLE}]\n(${WUERTH_HREF}): Matthäus Grzondziel`;
    assert.equal(normalizeAssistantMarkdown(raw), `[${WUERTH_TITLE}](${WUERTH_HREF}): Matthäus Grzondziel`);
  });

  it("joins a title that wrapped inside the brackets", () => {
    const wrapAt = WUERTH_TITLE.indexOf("Zonendaten");
    const raw = `- [${WUERTH_TITLE.slice(0, wrapAt)}\n  ${WUERTH_TITLE.slice(wrapAt)}] (${WUERTH_HREF}): rest`;
    assert.equal(normalizeAssistantMarkdown(raw), `- [${WUERTH_TITLE}](${WUERTH_HREF}): rest`);
  });

  it("does not treat a parenthetical after a bracket as a link", () => {
    const raw = "Matthäus Grzondziel [speaker] (Würth) betonte";
    assert.equal(normalizeAssistantMarkdown(raw), raw);
  });

  it("unwraps a bold-wrapped link", () => {
    assert.equal(
      normalizeAssistantMarkdown(`**[Titel](/de/beitrag/x/)**`),
      `[Titel](/de/beitrag/x/)`,
    );
  });
});

describe("splitMarkdownBlocks + tokenizeInline", () => {
  it("renders a canonical talk link", () => {
    assert.deepEqual(linksIn(`Siehe [${WUERTH_TITLE}](${WUERTH_HREF}).`), [
      { href: WUERTH_HREF, label: WUERTH_TITLE },
    ]);
  });

  it("renders the screenshot case: list item with a space before the URL", () => {
    const raw =
      `Ja, das Thema Datenqualität und -integrität in BIM-Modellen wurde in mehreren Vorträgen thematisiert:\n\n` +
      `- [${WUERTH_TITLE}] (${WUERTH_HREF}): Matthäus Grzondziel (Würth) betonte, dass KI zwischen Planung und Baustelle "verhungert", wenn Daten fehlen.`;
    const blocks = splitMarkdownBlocks(raw);
    assert.equal(blocks[1]?.kind, "ul");
    assert.deepEqual(linksIn(raw), [{ href: WUERTH_HREF, label: WUERTH_TITLE }]);
  });

  it("renders a link split across a list item and the next line", () => {
    const raw = `- [${WUERTH_TITLE}]\n(${WUERTH_HREF}): Matthäus Grzondziel (Würth) betonte`;
    assert.deepEqual(linksIn(raw), [{ href: WUERTH_HREF, label: WUERTH_TITLE }]);
  });

  it("keeps indented list continuations on the same item", () => {
    const raw = `- [${WUERTH_TITLE}](${WUERTH_HREF}): Matthäus\n  Grzondziel (Würth) betonte`;
    const blocks = splitMarkdownBlocks(raw);
    assert.deepEqual(blocks, [
      {
        kind: "ul",
        items: [`[${WUERTH_TITLE}](${WUERTH_HREF}): Matthäus Grzondziel (Würth) betonte`],
      },
    ]);
  });

  it("parses bold inside a link label", () => {
    const tokens = tokenizeInline("[**Titel**](/en/beitrag/x/)");
    assert.equal(tokens[0]?.kind, "link");
    if (tokens[0]?.kind !== "link") return;
    assert.equal(tokens[0].href, "/en/beitrag/x/");
    assert.equal(tokens[0].children[0]?.kind, "strong");
  });

  it("still renders **bold** and *emphasis* next to links", () => {
    const tokens = tokenizeInline("Siehe [Talk](/de/beitrag/x/) und **wichtig** plus *kurz*.");
    const kinds = tokens.map((t) => t.kind);
    assert.deepEqual(kinds, ["text", "link", "text", "strong", "text", "em", "text"]);
  });
});

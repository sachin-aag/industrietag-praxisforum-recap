// Builds the chatbot knowledge base from the raw transcripts in content/raw/ (gitignored)
// and writes it ENCRYPTED to src/server/knowledge.enc.json, which is safe to commit.
//
// Usage: KNOWLEDGE_KEY=<base64 32 bytes> node scripts/build-knowledge.mjs
// (or put KNOWLEDGE_KEY in .env.local; generate one with: openssl rand -base64 32)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createCipheriv, randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const raw = (f) => readFileSync(`${root}content/raw/${f}`, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

function loadKey() {
  let key = process.env.KNOWLEDGE_KEY;
  if (!key && existsSync(`${root}.env.local`)) {
    const m = readFileSync(`${root}.env.local`, "utf8").match(/^KNOWLEDGE_KEY=(.+)$/m);
    if (m) key = m[1].trim().replace(/^["']|["']$/g, "");
  }
  if (!key) throw new Error("KNOWLEDGE_KEY missing (env or .env.local)");
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) throw new Error("KNOWLEDGE_KEY must be 32 bytes, base64-encoded");
  return buf;
}

const clean = (s) =>
  s
    .replace(/\\([\[\]\-!*_])/g, "$1")
    .replace(/\\\\letter\s?/g, "")
    .replace(/K\\?letter I\\?letter/g, "KI")
    .replace(/\s+/g, " ")
    .trim();

/** Timestamped Reachy docs: assign each line to a talk by (verified) Reachy-time ranges. */
function timedLines(file, ranges, { until } = {}) {
  const text = raw(file);
  const body = text.slice(text.indexOf("TRANSCRIPT"));
  const out = [];
  for (const line of body.split("\n")) {
    const m = line.match(/^\\?\[(\d\d:\d\d:\d\d)\\?\]\s*(.*)$/);
    if (!m) continue;
    const [, ts, rest] = m;
    if (until && ts >= until) break;
    if (/^Reachy:/.test(rest) || /^NOTE:/.test(rest)) continue;
    const textOnly = clean(rest.replace(/^Speaker \d+:\s*/, ""));
    if (textOnly.length < 3) continue;
    const r = ranges.find((x) => ts >= x.from && ts < x.to);
    if (r) out.push({ slug: r.slug, ts, text: textOnly });
  }
  return out;
}

/** Saal 2 has no timestamps: split by self-introductions found in the text (verified manually). */
function saal2() {
  const text = raw("forum2-saal2.txt");
  const body = text.slice(text.indexOf("yougether"));
  const markers = [
    ["f2-muehlenbruch", 0],
    ["f2-mueller", "Zell Abig"],
    ["f2-belimo", "Alexander ist"],
    ["f2-voelkerling", "Ki in der Lüftungstechnik ist das Thema"],
    ["f2-rauh", "legen wir mal los . Christian"],
    ["f2-helbig", "Einen schönen guten Nachmittag"],
    ["f2-ferstl", "mein Name ist Jürgen Ferstl"],
    ["f2-pfau", "Simon V, mein Name"],
  ].map(([slug, m]) => {
    const at = typeof m === "number" ? m : body.indexOf(m);
    if (at < 0) throw new Error(`marker not found: ${m}`);
    return { slug, at };
  });
  markers.sort((a, b) => a.at - b.at);
  return markers.map((m, i) => ({ slug: m.slug, text: clean(body.slice(m.at, markers[i + 1]?.at ?? body.length)) }));
}

function chunkLines(lines, size = 1400) {
  const chunks = [];
  let cur = null;
  for (const l of lines) {
    if (!cur || cur.slug !== l.slug || cur.text.length > size) {
      cur = { slug: l.slug, from: l.ts, text: "" };
      chunks.push(cur);
    }
    cur.text += (cur.text ? " " : "") + l.text;
  }
  return chunks;
}

function chunkText(slug, text, size = 1400) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let buf = "";
  for (const s of sentences) {
    if (buf.length + s.length > size && buf) {
      chunks.push({ slug, text: buf.trim() });
      buf = "";
    }
    buf += s + " ";
  }
  if (buf.trim().length > 40) chunks.push({ slug, text: buf.trim() });
  return chunks;
}

const opening = timedLines("opening-1200.txt", [{ slug: "eroeffnung", from: "12:00:00", to: "12:20:00" }]);
const keynotes = timedLines("keynotes-1216.txt", [
  { slug: "eroeffnung", from: "12:00:00", to: "12:20:50" },
  { slug: "impuls-1-liebl", from: "12:20:50", to: "12:47:35" },
  { slug: "impuls-2-aechtler", from: "12:47:35", to: "13:18:00" },
  { slug: "impuls-3-huber", from: "13:18:00", to: "13:47:40" },
  { slug: "impulse-diskussion", from: "13:47:40", to: "13:53:40" },
]);
// Forum 1: speaker boundaries verified from self-introductions in the transcript (Reachy time = CET - 1h).
// Stops before the informal chat after the Q&A.
const forum1 = timedLines(
  "forum1-1427.txt",
  [
    { slug: "f1-bengel", from: "14:27:00", to: "14:47:40" },
    { slug: "f1-wuerth", from: "14:47:40", to: "15:05:00" },
    { slug: "f1-tsagkalidi", from: "15:05:00", to: "15:26:30" },
    { slug: "f1-jaeger", from: "15:26:30", to: "15:48:30" },
    { slug: "f1-duftschmid", from: "15:48:30", to: "16:08:00" },
    { slug: "f1-ocklenburg", from: "16:08:00", to: "16:30:30" },
    { slug: "f1-petraus", from: "16:30:30", to: "17:19:30" },
  ],
  { until: "17:19:30" }
);

const chunks = [
  ...chunkLines(opening),
  ...chunkLines(keynotes),
  ...chunkLines(forum1),
  ...saal2().flatMap((s) => chunkText(s.slug, s.text)),
].map((c, i) => ({ id: i, slug: c.slug, text: c.text }));

const plain = Buffer.from(JSON.stringify({ version: 1, builtAt: new Date().toISOString(), chunks }), "utf8");
const key = loadKey();
const iv = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", key, iv);
const data = Buffer.concat([cipher.update(plain), cipher.final()]);
writeFileSync(
  `${root}src/server/knowledge.enc.json`,
  JSON.stringify({ alg: "aes-256-gcm", iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: data.toString("base64") })
);

const bySlug = chunks.reduce((m, c) => ((m[c.slug] = (m[c.slug] ?? 0) + 1), m), {});
console.log(`${chunks.length} chunks, ${plain.length} bytes plaintext →  src/server/knowledge.enc.json`);
console.log(bySlug);

// Renders the /[lang]/print/ route of the static export to A4 PDFs plus cover thumbnails.
// Usage: npm run build:pdf  (local only; Vercel serves the committed PDFs from public/)
import { createServer } from "node:http";
import { readFile, copyFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const OUT = fileURLToPath(new URL("../out/", import.meta.url));
const PUBLIC = fileURLToPath(new URL("../public/", import.meta.url));
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2", ".txt": "text/plain" };

const server = createServer(async (req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (path.endsWith("/")) path += "index.html";
  const file = join(OUT, path);
  try {
    await stat(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const targets = [
  { lang: "de", pdf: "praxisforum-2026-recap.pdf", cover: "pdf-cover.png", title: "Praxisforum 2026 – Rückblick" },
  { lang: "en", pdf: "praxisforum-2026-recap-en.pdf", cover: "pdf-cover-en.png", title: "Praxisforum 2026 – Recap" },
];

const browser = await chromium.launch();
try {
  for (const t of targets) {
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
    await page.goto(`${base}/${t.lang}/print/`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate((title) => (document.title = title), t.title);
    await page.locator(".p-cover").screenshot({ path: join(PUBLIC, t.cover), animations: "disabled" });
    await page.emulateMedia({ media: "print" });
    await page.pdf({ path: join(PUBLIC, t.pdf), preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });
    await page.close();
    for (const f of [t.pdf, t.cover]) await copyFile(join(PUBLIC, f), join(OUT, f));
    console.log(`wrote public/${t.pdf} and public/${t.cover}`);
  }
} finally {
  await browser.close();
  server.close();
}

// Renders the /[lang]/print/ route to A4 PDFs plus cover thumbnails (serves the build with `next start`).
// Usage: npm run build:pdf  (local only; Vercel serves the committed PDFs from public/)
import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const PUBLIC = fileURLToPath(new URL("../public/", import.meta.url));
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = 4329;

// Serve the production build with `next start` (run `next build` first).
const server = spawn(process.execPath, [join(ROOT, "node_modules/next/dist/bin/next"), "start", "-p", String(PORT)], { cwd: ROOT, stdio: "ignore" });
const base = `http://127.0.0.1:${PORT}`;
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`${base}/de/print/`)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

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
    console.log(`wrote public/${t.pdf} and public/${t.cover}`);
  }
} finally {
  await browser.close();
  server.kill();
}

// Renders the social preview images (Open Graph / Twitter), 1200×630, to public/og-de.png and public/og-en.png.
// Usage: node scripts/build-og.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("..", import.meta.url));
const b64 = (p, type) => `data:${type};base64,${readFileSync(root + p).toString("base64")}`;
const logo = b64("public/logos/industrietag-logo-blue.svg", "image/svg+xml");
const photo = b64("public/photos/03-buehne-zukunft.jpg", "image/jpeg");

const copy = {
  de: { line: "Praxisforum 2026 · Rückblick", title: "KI in Planung, Bau und Gebäudebetrieb", meta: "10. November 2026 · Bürgerhaus Kernen", stats: "3 Impulse · 16 Praxisbeiträge · 400 Gäste" },
  en: { line: "Praxisforum 2026 · Recap", title: "AI in planning, construction and building operations", meta: "10 November 2026 · Bürgerhaus Kernen", stats: "3 keynotes · 16 practice talks · 400 guests" },
};

const html = (c) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@500;600&family=Roboto+Condensed:wght@700&display=block" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;overflow:hidden;font-family:"Instrument Sans",sans-serif;color:#fff;
    background:linear-gradient(180deg,#2a4b9b 0%,#23438f 60%,#1c3576 100%);position:relative}
  .top{position:absolute;left:0;right:0;top:0;height:96px;background:#fff;display:flex;align-items:center;gap:24px;padding:0 64px}
  .top img{height:50px}
  .top span{font-family:"Roboto Condensed",sans-serif;font-size:26px;color:#2a4b9b;padding-left:24px;border-left:2px solid #d8deea}
  .text{position:absolute;left:64px;top:150px;width:600px}
  h1{font-family:"Roboto Condensed",sans-serif;font-size:66px;line-height:1.02;letter-spacing:-.005em}
  .meta{margin-top:28px;font-size:26px;color:#dfe6fa;font-weight:500}
  .stats{margin-top:10px;font-size:22px;color:#ffc926;font-weight:600}
  .photo{position:absolute;right:64px;top:150px;width:430px;height:323px;border-radius:14px;overflow:hidden;box-shadow:0 24px 60px rgba(10,20,60,.45)}
  .photo img{width:100%;height:100%;object-fit:cover}
  svg{position:absolute;left:0;bottom:0;width:1200px;height:150px}
</style></head><body>
  <div class="top"><img src="${logo}"><span>${c.line}</span></div>
  <div class="text"><h1>${c.title}</h1><p class="meta">${c.meta}</p><p class="stats">${c.stats}</p></div>
  <div class="photo"><img src="${photo}"></div>
  <svg viewBox="0 0 1200 150" preserveAspectRatio="none">
    <defs>
      <linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#18A0F5" stop-opacity="0"/><stop offset=".2" stop-color="#18A0F5"/><stop offset=".4" stop-color="#8A24DF"/><stop offset=".5" stop-color="#FFC926"/><stop offset=".6" stop-color="#E2307F"/><stop offset=".8" stop-color="#18A0F5"/><stop offset="1" stop-color="#18A0F5" stop-opacity="0"/></linearGradient>
      <radialGradient id="s" cx=".5" cy="1" r=".6"><stop offset="0" stop-color="#FFC926" stop-opacity=".5"/><stop offset=".4" stop-color="#FF7A3D" stop-opacity=".2"/><stop offset="1" stop-color="#8A24DF" stop-opacity="0"/></radialGradient>
      <filter id="b"><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <ellipse cx="600" cy="80" rx="520" ry="80" fill="url(#s)"/>
    <path d="M-100 150 Q600 20 1300 150 Z" fill="#121f4a"/>
    <path d="M-100 150 Q600 20 1300 150" fill="none" stroke="url(#g)" stroke-width="12" filter="url(#b)"/>
    <path d="M-100 150 Q600 20 1300 150" fill="none" stroke="url(#g)" stroke-width="2.5"/>
  </svg>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const lang of ["de", "en"]) {
  await page.setContent(html(copy[lang]), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${root}public/og-${lang}.png` });
  console.log(`wrote public/og-${lang}.png`);
}
await browser.close();

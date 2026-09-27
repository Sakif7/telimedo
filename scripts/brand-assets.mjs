// Generates the static brand assets Next.js serves from src/app:
//   favicon.ico (16/32/48 px), apple-icon.png (180 px) from public/brand/telimedo-mark.svg,
//   opengraph-image.png (1200x630) from the poster, the wordmark and the hero line.
// Usage: node scripts/brand-assets.mjs   (needs `npx playwright install chromium` and network for Google Fonts)
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p));
const mark = read('public/brand/telimedo-mark.svg').toString('utf8').trim();
const wordmark = read('public/brand/telimedo-wordmark.svg').toString('utf8').trim();
const poster = `data:image/webp;base64,${read('public/images/poster-light.webp').toString('base64')}`;
const out = (f) => path.join(root, 'src/app', f);

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function renderMark(size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${mark}`);
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

// favicon.ico: an ICO container holding PNG images
const sizes = [16, 32, 48];
const pngs = [];
for (const s of sizes) pngs.push(await renderMark(s));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const dir = [];
sizes.forEach((s, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(s, 0); e.writeUInt8(s, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(pngs[i].length, 8); e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  dir.push(e);
});
fs.writeFileSync(out('favicon.ico'), Buffer.concat([header, ...dir, ...pngs]));

// apple-icon.png: full-bleed (iOS masks the corners itself and shows transparency as black)
await page.setViewportSize({ width: 180, height: 180 });
await page.setContent(`<!doctype html><style>html,body{margin:0;background:#fff}svg{display:block;width:180px;height:180px}</style>${mark}`);
fs.writeFileSync(out('apple-icon.png'), await page.screenshot({ clip: { x: 0, y: 0, width: 180, height: 180 } }));

// opengraph-image.png: the studio, the buddy and the hero line
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<!doctype html>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Figtree:wght@300..900&display=block">
<style>
  html, body { margin: 0; }
  .card { position: relative; width: 1200px; height: 630px; overflow: hidden; font-family: Figtree, sans-serif; color: #12212A;
    background: radial-gradient(58% 60% at 74% 44%, rgba(255,255,255,.92), transparent 72%), linear-gradient(165deg, #DCF1F5 8%, #F8E6E2 92%); }
  .card::after { content: ""; position: absolute; left: 76%; bottom: -14%; width: 90%; height: 44%; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(closest-side, rgba(18,33,42,.10), transparent); }
  .copy { position: absolute; left: 72px; top: 64px; width: 620px; }
  .brand svg { height: 40px; width: auto; display: block; }
  h1 { margin: 72px 0 0; font: 560 92px/.95 "Bricolage Grotesque", sans-serif; font-optical-sizing: auto; letter-spacing: -0.045em; }
  .w { position: relative; display: inline-block; }
  .w svg { position: absolute; left: 0; top: 100%; width: 100%; height: 28px; margin-top: -2px; overflow: visible; }
  p { margin: 44px 0 0; font: 500 26px/1.35 Figtree, sans-serif; color: #435660; max-width: 30rem; }
  .poster { position: absolute; right: 36px; bottom: -34px; height: 640px; }
</style>
<div class="card">
  <div class="copy">
    <div class="brand">${wordmark}</div>
    <h1>Care closer to every <span class="w">patient.<svg id="pulse" aria-hidden="true"><path fill="none" stroke="#F77F7F" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></h1>
    <p>Virtual care platform for clinics</p>
  </div>
  <img class="poster" src="${poster}" alt="">
</div>
<script>
  document.fonts.ready.then(() => {
    const word = document.querySelector('.w'), svg = document.getElementById('pulse');
    const w = word.getBoundingClientRect().width, y = 12, c = w * 0.46;
    svg.setAttribute('viewBox', '0 0 ' + w + ' 28');
    svg.querySelector('path').setAttribute('d', 'M2 ' + y + ' L' + (c - 20) + ' ' + y + ' Q' + (c - 15) + ' ' + (y - 5) + ' ' + (c - 10) + ' ' + y + ' L' + (c - 5) + ' ' + y + ' L' + (c - 2) + ' ' + (y + 5) + ' L' + (c + 2) + ' ' + (y - 11) + ' L' + (c + 6) + ' ' + (y + 13) + ' L' + (c + 9) + ' ' + y + ' L' + (c + 17) + ' ' + y + ' Q' + (c + 24) + ' ' + (y - 7) + ' ' + (c + 31) + ' ' + y + ' L' + (w - 2) + ' ' + y);
    document.body.dataset.ready = '1';
  });
</script>`);
await page.waitForSelector('body[data-ready="1"]', { timeout: 30000 });
await page.waitForTimeout(300);
fs.writeFileSync(out('opengraph-image.png'), await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } }));

await browser.close();
console.log('wrote favicon.ico, apple-icon.png, opengraph-image.png to src/app');

// Screenshots of every named moment: the hero, each story step and every section.
// Usage: node scripts/shots.mjs [desktop|small|wide|mobile] [outDir] [comma,separated,names]
// Env: BASE_URL (default http://localhost:3000), SCHEME=dark, NO_WEBGL=1, REDUCED=1. Writes PNG files.
// Needs the app running (npm run dev, or npm run build && npm start) and `npx playwright install chromium` once.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const [, , mode = 'desktop', outDir = 'test-results/shots', only = ''] = process.argv;
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const mobile = mode === 'mobile';
const viewport = mobile ? { width: 390, height: 844 } : mode === 'small' ? { width: 1280, height: 720 } : mode === 'wide' ? { width: 1920, height: 1080 } : { width: 1440, height: 900 };
const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
if (process.env.NO_WEBGL) args.push('--disable-webgl', '--disable-webgl2');

export const MOMENTS = [
  ['hero', 0], ['logos', '#customers'], ['manifesto', '#why'], ['storyhead', '#how'],
  ['listen', { story: 0.03 }], ['seeDive', { story: 0.19 }], ['portal', { story: 0.225 }], ['seeOpen', { story: 0.3 }], ['care', { story: 0.48 }],
  ['flip', { story: 0.555 }], ['flight', { story: 0.64 }], ['stretch', { story: 0.72 }], ['handoff', { story: 0.8 }], ['dock', { story: 0.92 }], ['unpin', { story: 1.02 }],
  ['product', '#product'], ['product2', '[data-moment="product2"]'], ['solutions', '#solutions'], ['proof', '#proof'], ['security', '#security'],
  ['pricing', '#pricing'], ['faq', '#faq'], ['cta', '#demo'], ['footer', 'footer'],
];

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args });
const ctx = await browser.newContext({
  viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile,
  colorScheme: process.env.SCHEME || 'light', reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference',
});
const page = await ctx.newPage();
await page.addInitScript(() => { window.__buddyDtCap = 1; });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(BASE + '/', { waitUntil: 'load' });
await page.waitForFunction(() => window.__buddy && (window.__buddy.ready() || window.__buddy.no3d()), null, { timeout: 180000 });

let k = 0;
for (const [name, where] of MOMENTS) {
  const idx = String(k++).padStart(2, '0');
  if (only && !only.split(',').includes(name)) continue;
  const y = await page.evaluate((w) => {
    if (typeof w === 'number') return w;
    if (w.story != null) return window.__buddy.storyY(w.story);
    const el = document.querySelector(w);
    return el.getBoundingClientRect().top + scrollY - (w === '#demo' ? 0 : 70);
  }, where);
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
  await page.waitForTimeout(name === 'hero' ? 5000 : 2600);
  await page.screenshot({ path: path.join(outDir, `${idx}-${name}.png`) });
}
console.log('mode at end', await page.evaluate(() => window.__buddy.mode()), 'no3d', await page.evaluate(() => window.__buddy.no3d()));
console.log(logs.slice(0, 20).join('\n') || 'no console errors');
await browser.close();

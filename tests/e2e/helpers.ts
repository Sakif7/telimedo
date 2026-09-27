import { expect, type Page } from '@playwright/test';

/** Collects console errors and warnings (hydration warnings included) and page errors. */
export function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  return problems;
}

/** Opens the page with the test hooks on and waits for the 3D (or the no-WebGL fallback).
    The first-visit doors are skipped (as on a repeat visit) unless a test asks for them. */
export async function openHome(page: Page, { calm = true, doors = false } = {}) {
  await page.addInitScript(
    ([c, d]) => {
      window.__buddyDtCap = 1;
      if (c) window.__buddyCalm = true;
      if (!d) sessionStorage.setItem('telimedo:doors', '1');
    },
    [calm, doors],
  );
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__buddy && (window.__buddy.ready() || window.__buddy.no3d()), null, { timeout: 180_000 });
  await page.evaluate(() => document.fonts.ready);
}

export async function scrollToMoment(page: Page, where: number | string | { story: number }) {
  const y = await page.evaluate((w) => {
    if (typeof w === 'number') return w;
    if (typeof w === 'object') return window.__buddy!.storyY(w.story);
    const el = document.querySelector(w)!;
    return el.getBoundingClientRect().top + scrollY - (w === '#demo' ? 0 : 70);
  }, where);
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
}

/** Waits for the story's smoothed progress to settle and a few frames to render. */
export async function settle(page: Page, ms = 2600) {
  await page.waitForTimeout(ms);
}

export function expectNoProblems(problems: string[]) {
  expect(problems, problems.join('\n')).toEqual([]);
}

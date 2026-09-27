import { expect, test } from '@playwright/test';
import { expectNoProblems, openHome, scrollToMoment, settle, watchConsole } from './helpers';

/* Runs in the no-webgl project (WebGL disabled in the browser). Posters stay in
   the studios, the call shows on step 2 and the dashboard on step 4. */

test('works without WebGL', async ({ page }) => {
  const problems = watchConsole(page);
  await openHome(page);
  expect(await page.evaluate(() => window.__buddy!.no3d())).toBe(true);
  expect(await page.evaluate(() => document.querySelectorAll('canvas').length)).toBe(0);

  // hero: poster visible, chips hidden
  const heroPoster = page.locator('[data-studio="hero"] [data-part="poster"]');
  await expect(heroPoster).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-studio="hero"] [data-at]').first()).toBeHidden();

  // step 2: the call, shown flat
  await scrollToMoment(page, { story: 0.3 });
  await settle(page, 1500);
  const call = page.locator('#how [data-part="call"]');
  await expect(call).toHaveCSS('visibility', 'visible');
  await expect(call).toHaveCSS('opacity', '1');

  // step 4: the dashboard appears as the studio widens
  await scrollToMoment(page, { story: 0.92 });
  await settle(page, 1500);
  const device = page.getByRole('region', { name: /Interactive Telimedo workspace/ });
  await expect(device).toHaveCSS('opacity', '1');
  await expect(device).not.toHaveAttribute('inert', /.*/);

  // demo: poster visible
  await scrollToMoment(page, '#demo');
  await settle(page, 800);
  await expect(page.locator('[data-studio="cta"] [data-part="poster"]')).toHaveCSS('opacity', '1');
  expectNoProblems(problems);
});

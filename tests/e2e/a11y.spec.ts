import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { openHome } from './helpers';

/* Accessibility smoke test: axe (WCAG 2.1 A and AA) finds no serious or
   critical issues, and the skip link is the first stop for keyboard users. */

test('axe finds no serious or critical issues', async ({ page }) => {
  await openHome(page);
  // visit the sections once so entrance reveals have played (axe would measure colours mid-fade otherwise)
  for (const sel of ['#how', '#product', '#solutions', '#proof', '#security', '#pricing', '#faq', '#demo', 'footer']) {
    await page.locator(sel).first().scrollIntoViewIfNeeded();
  }
  // one-time reveal demos (bento cards, the security record) run up to about 2.6 s; let them finish
  await page.waitForTimeout(3500);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const report = serious.map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.slice(0, 5).map((n) => n.target.join(' ')).join('\n  ')}`).join('\n');
  expect(serious, report).toEqual([]);
});

test('the skip link comes first and moves focus to the content', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard check');
  await openHome(page);
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
});

import { expect, test, type Page } from '@playwright/test';
import { expectNoProblems, openHome, scrollToMoment, settle, watchConsole } from './helpers';

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const box = async (page: Page, selector: string) => (await page.locator(selector).first().boundingBox())!;

test.describe('3D and story', () => {
  test('the flying tablet lands on the device within 3 px before the dashboard fades in', async ({ page }) => {
    const problems = watchConsole(page);
    await openHome(page);
    // r just past 0.87: the flight has finished (k = 1) and the HTML device is starting to fade in
    await scrollToMoment(page, { story: 0.812 });
    await settle(page, 3200);
    const m = await page.evaluate(() => window.__buddy!.landing());
    expect(m, 'tablet visible at the hand-off').not.toBeNull();
    const { tablet: t, device: d } = m!;
    const err = Math.max(Math.abs(t.x - d.x), Math.abs(t.y - d.y), Math.abs(t.x + t.w - (d.x + d.w)), Math.abs(t.y + t.h - (d.y + d.h)));
    test.info().annotations.push({ type: 'landing error (px)', description: err.toFixed(2) });
    console.log(`landing error: ${err.toFixed(2)} px (tablet ${JSON.stringify(t)} device ${JSON.stringify(d)})`);
    expect(err).toBeLessThanOrEqual(3);
    expectNoProblems(problems);
  });

  test('the lens glow stays on the rim when the head turns', async ({ page, isMobile }) => {
    test.skip(isMobile, 'needs a mouse');
    await openHome(page);
    for (const [x, y] of [[80, 300], [1400, 160], [700, 860]]) {
      await page.mouse.move(x, y, { steps: 4 });
      await settle(page, 2500);
      const g = await page.evaluate(() => window.__buddy!.glowCheck());
      console.log(`pointer ${x},${y}: head yaw ${g!.yaw.toFixed(3)} rad, pitch ${g!.pitch.toFixed(3)}, glow offset ${g!.err.toFixed(2)} px`);
      expect(g!.err).toBeLessThan(3);
    }
    const turned = await page.evaluate(() => Math.abs(window.__buddy!.glowCheck()!.yaw) + Math.abs(window.__buddy!.glowCheck()!.pitch));
    expect(turned).toBeGreaterThan(0.05);
  });

  test('one canvas moves between the studios', async ({ page }) => {
    await openHome(page);
    for (const [where, mode] of [[0, 'hero'], [{ story: 0.3 }, 'story'], ['#demo', 'cta']] as const) {
      await scrollToMoment(page, where);
      await settle(page, 1800);
      expect(await page.evaluate(() => window.__buddy!.mode())).toBe(mode);
      expect(await page.evaluate(() => window.__buddy!.canvases())).toBe(1);
    }
  });
});

test.describe('layout', () => {
  test('copy never overlaps the buddy', async ({ page, isMobile }) => {
    await openHome(page);
    const heroCopy = await box(page, '[data-studio="hero"] h1');
    const heroLede = await box(page, '[data-studio="hero"] .lede');
    const heroStage = await page.evaluate(() => {
      const r = document.querySelector('[data-studio="hero"] [data-part="stage"]')!.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    expect(overlaps(heroCopy, heroStage)).toBe(false);
    expect(overlaps(heroLede, heroStage)).toBe(false);
    if (!isMobile) {
      // floating chips keep clear of the headline column
      const chips = await page.locator('[data-studio="hero"] [data-at]').all();
      for (const c of chips) {
        const visible = await c.evaluate((el) => getComputedStyle(el).opacity !== '0' && getComputedStyle(el).display !== 'none');
        if (visible) expect(overlaps((await c.boundingBox())!, heroCopy)).toBe(false);
      }
    }
    // the story rail and the studio sit side by side (desktop) or stacked (phone)
    for (const sp of [0.03, 0.3, 0.48]) {
      await scrollToMoment(page, { story: sp });
      await settle(page, 1500);
      const rail = await page.evaluate(() => {
        const r = document.querySelector('#how [data-part="rail"]')!.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });
      const studio = await page.evaluate(() => {
        const s = document.querySelector('#how [data-part="studio"]')!.getBoundingClientRect();
        return { x: s.x, y: s.y, width: s.width, height: s.height };
      });
      expect(overlaps(rail, studio), `rail and studio at ${sp}`).toBe(false);
    }
  });

  test('no horizontal scroll at 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await openHome(page);
    for (const where of [0, '#why', { story: 0.3 }, { story: 0.92 }, '#product', '#solutions', '#pricing', '#demo', 'footer'] as const) {
      await scrollToMoment(page, where);
      await settle(page, 600);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `overflow at ${JSON.stringify(where)}`).toBeLessThanOrEqual(0);
    }
  });
});

test.describe('interactions', () => {
  test('tabs, billing, FAQ, booking, waiting room and form', async ({ page, isMobile }) => {
    const problems = watchConsole(page);
    await openHome(page);

    // Solutions tabs: arrow keys move selection and focus
    await page.locator('#tab-clinics').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-employers')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tab-employers')).toBeFocused();
    await expect(page.locator('#panel-employers')).toBeVisible();
    await expect(page.locator('#panel-clinics')).toBeHidden();

    // Billing: annual prices
    await page.getByRole('button', { name: /^Annual/ }).click();
    await expect(page.locator('#pricing [data-reveal] b.ph').first()).toHaveText('$42', { timeout: 5000 });
    await expect(page.locator('#pricing [data-reveal] b.ph').nth(1)).toHaveText('$76');

    // FAQ: the first answer is open; opening another sets aria-expanded and removes inert
    const q2 = page.locator('#qa2-q');
    await expect(q2).toHaveAttribute('aria-expanded', 'false');
    await q2.click();
    await expect(q2).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#qa2')).not.toHaveAttribute('inert', /.*/);

    // Booking vignette
    await page.locator('#product button:not([disabled])', { hasText: '10:00' }).first().click();
    await expect(page.locator('#product [aria-live="polite"]')).toContainText('Booked for Tuesday 29 at 10:00');

    // Waiting room
    await page.getByRole('button', { name: 'Admit' }).first().click();
    await expect(page.locator('#product').getByText('Live', { exact: true })).toBeVisible();

    // Demo form: inline errors, then the thank-you message
    await page.locator('#demo').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Book my demo' }).click();
    await expect(page.locator('#f-name-err')).toBeVisible();
    await expect(page.locator('#f-name')).toBeFocused();
    await page.locator('#f-name').fill('Ana Moreno');
    await page.locator('#f-email').fill('not-an-email');
    await page.getByRole('button', { name: 'Book my demo' }).click();
    await expect(page.locator('#f-email-err')).toBeVisible();
    await page.locator('#f-email').fill('ana@clinic.com');
    await page.getByRole('button', { name: 'Book my demo' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Thanks, Ana.' })).toBeVisible();

    // Phone menu: Escape closes it and returns focus
    if (isMobile) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      const menu = page.getByRole('button', { name: 'Open menu' });
      await menu.click();
      await expect(page.locator('#mobile-nav')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('#mobile-nav')).toBeHidden();
      await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
    }
    expectNoProblems(problems);
  });

  test('the live dashboard responds on the device', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the phone view is a static snapshot of the day');
    await openHome(page);
    await scrollToMoment(page, { story: 0.92 });
    await settle(page, 2600);
    const device = page.getByRole('region', { name: /Interactive Telimedo workspace/ });
    await expect(device).not.toHaveAttribute('inert', /.*/);
    await device.getByRole('button', { name: '7D' }).click();
    await expect(device.getByText('Last 7 days').first()).toBeVisible();
    await device.getByRole('button', { name: 'Appointments' }).click();
    await expect(device.getByRole('heading', { name: 'Appointments' })).toBeVisible();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the story snaps between steps', async ({ page }) => {
    const problems = watchConsole(page);
    await openHome(page, { calm: false });
    await scrollToMoment(page, { story: 0.3 });
    await settle(page, 1500);
    const call = await page.evaluate(() => {
      const w = document.querySelector('#how [data-part="call"]') as HTMLElement;
      return { vis: getComputedStyle(w).visibility, op: getComputedStyle(w).opacity };
    });
    expect(call.vis).toBe('visible');
    expect(Number(call.op)).toBeGreaterThan(0.99);
    await scrollToMoment(page, { story: 0.92 });
    await settle(page, 1500);
    const device = page.getByRole('region', { name: /Interactive Telimedo workspace/ });
    await expect(device).toHaveCSS('opacity', '1');
    await expect(device).not.toHaveAttribute('inert', /.*/);
    expectNoProblems(problems);
  });
});

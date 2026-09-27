import { clamp, easeOutCubic, prefersReducedMotion } from './motion';

/** Counts [data-count] figures up from zero once, keeping prefix, suffix and decimals
    (v1 page.js countUp). The final text is what React rendered, so nothing is lost.
    data-count-delay (ms) waits before counting, e.g. until a card has revealed. */
export function countUp(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const final = el.textContent ?? '';
    const m = final.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
    if (!m || prefersReducedMotion()) return;
    const [, pre, num, post] = m;
    const dec = (num.split('.')[1] || '').length, to = parseFloat(num);
    el.textContent = pre + (0).toFixed(dec) + post;
    const t0 = performance.now() + (Number(el.dataset.countDelay) || 0), dur = 1400;
    const step = (now: number) => {
      const k = clamp((now - t0) / dur);
      if (k <= 0) {
        requestAnimationFrame(step);
        return;
      }
      el.textContent = pre + (to * easeOutCubic(k)).toFixed(dec) + post;
      if (k < 1) requestAnimationFrame(step);
      else el.textContent = final;
    };
    requestAnimationFrame(step);
  });
}

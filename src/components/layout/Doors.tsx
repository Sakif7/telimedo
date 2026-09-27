'use client';

import { useEffect, useRef } from 'react';
import s from './Doors.module.css';

/* The first-visit opening. Two dark doors meet along a heartbeat line. The line
   fills as the page and the 3D load (the runtime sets --load on <html>), lights up
   once, and the doors part vertically as the buddy rises (the runtime starts his
   intro at .doors-open). Only on the first load of a visit, only with scripts and
   without reduced motion: the layout's boot script adds .doors-open/.doors-done
   straight away otherwise, so nothing ever waits behind them. */

/** The seam: [x in %, offset from the middle in px (negative is up)]. */
const SEAM: [number, number][] = [
  [0, 0], [34, 0], [36, -6], [38, -9], [40, -6], [42, 0], [45.5, 0], [46.5, 12], [48.2, -92], [50, 44], [51.4, 0],
  [55, 0], [57, -14], [59.5, -20], [62, -14], [64, 0], [100, 0],
];
const pt = ([x, y]: [number, number]) => `${x}% calc(50% + ${y}px)`;
const TOP = `polygon(0 0, 100% 0, ${[...SEAM].reverse().map(pt).join(', ')})`;
const BOTTOM = `polygon(${SEAM.map(pt).join(', ')}, 100% 100%, 0 100%)`;
const LINE = 'M' + SEAM.map(([x, y]) => `${x} ${y}`).join(' L');

const MIN_MS = 700; // long enough for the line to read as a heartbeat
const MAX_MS = 3000; // never keep the page waiting longer than this
const FILL_MS = 560; // the line finishing its run
const BEAT_MS = 460; // the line lighting up before the doors part
const OPEN_MS = 1200; // the doors sliding away

export function Doors({ wordmark }: { wordmark: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement, el = root.current;
    if (!el || html.classList.contains('doors-open')) return;
    const t0 = performance.now();
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    html.style.setProperty('--load', '0.12');
    let opening = false;
    const open = () => {
      if (opening) return;
      opening = true;
      html.style.setProperty('--load', '1');
      later(() => {
        el.dataset.state = 'beat';
        later(() => {
          html.classList.add('doors-open');
          try {
            sessionStorage.setItem('telimedo:doors', '1');
          } catch {
            // without storage the doors simply play again next time
          }
          later(() => html.classList.add('doors-done'), OPEN_MS);
        }, BEAT_MS);
      }, FILL_MS);
    };
    // ready: the buddy has drawn, WebGL is missing, or the still has taken over from a slow start
    const ready = () => ['gl-live', 'no-3d', 'poster-late'].some((c) => html.classList.contains(c));
    const check = () => {
      if (ready() && performance.now() - t0 >= MIN_MS) open();
    };
    const mo = new MutationObserver(check);
    mo.observe(html, { attributes: true, attributeFilter: ['class'] });
    later(check, MIN_MS);
    later(open, MAX_MS);
    return () => {
      mo.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className={s.doors} aria-hidden="true" data-part="doors" ref={root}>
      <div className={`${s.door} ${s.top}`} style={{ clipPath: TOP }}>
        <span className={s.mark} dangerouslySetInnerHTML={{ __html: wordmark }} />
      </div>
      <div className={`${s.door} ${s.bottom}`} style={{ clipPath: BOTTOM }} />
      <svg className={s.seam} viewBox="0 -100 100 200" preserveAspectRatio="none">
        <path className={s.base} d={LINE} />
        <path className={s.lit} d={LINE} />
      </svg>
    </div>
  );
}

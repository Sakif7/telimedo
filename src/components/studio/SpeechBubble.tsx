'use client';

import { useEffect, useRef, type Ref } from 'react';
import { BUDDY_IN_EVENT } from '@/lib/runtime/signals';
import s from './Studio.module.css';

const TYPE_MS = 30, HOLD_MS = 2800;

type Props = { ref?: Ref<HTMLDivElement>; lines: readonly string[]; at: string; off: string };

/** What the buddy says, one line at a time, typed in once he is in place. The engine anchors the
    bubble above his head, to the left (data-at, data-off; its bottom-right corner on the point). Letters are written straight to the DOM, so typing
    causes no React renders; a hidden copy of the full line sizes the bubble so it doesn't jump.
    Reduced motion swaps whole lines; test runs (calm mode) keep the first line. */
export function SpeechBubble({ ref, lines, at, off }: Props) {
  const full = useRef<HTMLSpanElement>(null);
  const typed = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fullEl = full.current, typedEl = typed.current;
    if (!fullEl || !typedEl) return;
    const stop = new AbortController();
    let timer = 0;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = window.setTimeout(resolve, ms);
      });
    const arrived = () =>
      document.documentElement.classList.contains('buddy-in')
        ? Promise.resolve()
        : new Promise<void>((resolve) => window.addEventListener(BUDDY_IN_EVENT, () => resolve(), { once: true, signal: stop.signal }));

    (async () => {
      await arrived();
      if (stop.signal.aborted || window.__buddyCalm) return;
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      for (let i = 0; !stop.signal.aborted; i = (i + 1) % lines.length) {
        const line = lines[i];
        fullEl.textContent = line;
        if (reduce) typedEl.textContent = line;
        else
          for (let n = 1; n <= line.length && !stop.signal.aborted; n++) {
            typedEl.textContent = line.slice(0, n);
            await wait(TYPE_MS);
          }
        await wait(HOLD_MS);
      }
    })();
    return () => {
      stop.abort();
      clearTimeout(timer);
    };
  }, [lines]);

  return (
    <div className={s.says} data-at={at} data-off={off} data-align="right" data-valign="bottom" data-interactive="" aria-hidden="true" ref={ref}>
      <span className={s.saysFull} ref={full}>
        {lines[0]}
      </span>
      <span className={s.saysTyped} ref={typed}>
        {lines[0]}
      </span>
    </div>
  );
}

'use client';

import { useLayoutEffect, useRef } from 'react';

/** The heartbeat line under "patient.": measured to the word so the spike keeps
    its shape at every size, then drawn once (v1 page.js buildPulse). */
export function HeroPulse({ className }: { className: string }) {
  const svg = useRef<SVGSVGElement>(null);
  useLayoutEffect(() => {
    const el = svg.current;
    const word = el?.parentElement;
    if (!el || !word) return;
    const build = () => {
      const w = Math.max(60, word.getBoundingClientRect().width), h = 28, y = 12;
      const c = w * 0.46;
      const d = `M2 ${y} L${c - 20} ${y} Q${c - 15} ${y - 5} ${c - 10} ${y} L${c - 5} ${y} L${c - 2} ${y + 5} L${c + 2} ${y - 11} L${c + 6} ${y + 13} L${c + 9} ${y} L${c + 17} ${y} Q${c + 24} ${y - 7} ${c + 31} ${y} L${w - 2} ${y}`;
      el.setAttribute('viewBox', `0 0 ${w.toFixed(1)} ${h}`);
      el.querySelector('path')?.setAttribute('d', d);
      el.setAttribute('data-ready', '');
    };
    build();
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(build);
    };
    window.addEventListener('resize', onResize);
    document.fonts?.ready.then(build);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <svg className={className} aria-hidden="true" ref={svg}>
      <path pathLength={1} />
    </svg>
  );
}

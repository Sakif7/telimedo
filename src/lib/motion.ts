/* Math and motion helpers shared by the story, the 3D engine and page effects.
   Nothing here touches window at import time, so it is safe in server bundles. */

export type Rect = { x: number; y: number; w: number; h: number };

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeOutBack = (t: number) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

/** Live reduced-motion flag read every frame by the story and the engine.
    Starts false on the server; watchReducedMotion() keeps it current in the browser. */
export const motion = { reduce: false };

export function watchReducedMotion(): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  motion.reduce = mq.matches;
  const on = (e: MediaQueryListEvent) => {
    motion.reduce = e.matches;
  };
  mq.addEventListener('change', on);
  return () => mq.removeEventListener('change', on);
}

/** One-off check for event handlers in components. */
export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isFinePointer = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

import type { Ref } from 'react';
import s from './Studio.module.css';

/** Lit studio background: glow, gradient, grain and floor; optional sonar rings. */
export function StudioBackdrop({ className, rings = false }: { className?: string; rings?: boolean }) {
  return (
    <div className={className ? `${s.bg} ${className}` : s.bg} aria-hidden="true">
      {rings ? (
        <div className={s.rings}>
          <i />
          <i />
          <i />
          <i />
        </div>
      ) : null}
    </div>
  );
}

/** Empty host for the WebGL canvas. The engine appends the canvas; React never renders into it. */
export function GlSlot({ ref, fill = false }: { ref?: Ref<HTMLDivElement>; fill?: boolean }) {
  return <div ref={ref} className={fill ? `${s.slot} ${s.fill}` : s.slot} aria-hidden="true" />;
}

/** The buddy still. `fit` places it by CSS inside its stage (which must be a size container).
    `intro`: the studio where the buddy peeks in on load; the still only shows without WebGL,
    or when the 3D is slow to start. */
export function Poster({ ref, fit = false, intro = false, className }: { ref?: Ref<HTMLDivElement>; fit?: boolean; intro?: boolean; className?: string }) {
  const cls = [s.poster, fit ? s.fit : '', intro ? s.intro : '', className ?? ''].filter(Boolean).join(' ');
  return <div ref={ref} className={cls} aria-hidden="true" data-part="poster" />;
}

export const studioClasses = s;

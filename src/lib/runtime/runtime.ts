import { mountCompact, mountDesk } from '@/components/product-mock/mount';
import { site } from '@/content/site';
import type { Buddy, Chip, Mode } from '@/lib/buddy/engine';
import { motion, watchReducedMotion } from '@/lib/motion';
import { createStory } from '@/lib/story/controller';
import { KF } from '@/lib/story/timeline';
import { createPageFx } from './page-fx';
import type { BrandSvgs, Registry } from './types';

/* Wiring (v1 main.js): mounts the product UI, creates the story controller and
   the page effects, lazily loads the 3D engine, picks the active studio every
   frame and runs the single requestAnimationFrame loop. Client-only; created
   after hydration by RuntimeProvider and disposed with it. */

export const ASSETS = {
  model: '/models/telimedo_buddy.glb',
  decoder: '/draco/',
  desk: '/textures/tex_desk.webp',
  compact: '/textures/tex_compact.webp',
};

/** Test hooks are on in development, and in any build when a script opts in
    (tests set window.__buddyDtCap before load). */
const hooksEnabled = () => process.env.NODE_ENV !== 'production' || window.__buddyDtCap != null;

export type Runtime = { sayHi: () => void; dispose: () => void };

export function createRuntime(reg: Registry, { brand }: { brand: BrandSvgs }): Runtime | null {
  const storyRefs = reg.story;
  if (!storyRefs) return null;
  const docEl = document.documentElement;
  let disposed = false;
  const cleanups: (() => void)[] = [];
  cleanups.push(watchReducedMotion());

  /* product UI inside the device */
  const goDemo = () => document.getElementById('demo')?.scrollIntoView({ behavior: motion.reduce ? 'auto' : 'smooth' });
  const desk = mountDesk(storyRefs.appDesk, { onDemo: goDemo, brand });
  const compact = mountCompact(storyRefs.appCompact, { brand });
  cleanups.push(desk.dispose, compact.dispose);

  const story = createStory(storyRefs, { countLabel: site.story.count });
  cleanups.push(story.dispose);
  let buddy: Buddy | null = null;
  const fx = createPageFx({ story, manifesto: reg.manifesto });
  cleanups.push(fx.dispose);

  const posters = [reg.hero?.poster, storyRefs.poster, reg.cta?.poster].filter(Boolean) as HTMLElement[];

  function no3d() {
    if (disposed) return;
    docEl.classList.add('no-3d');
    docEl.classList.remove('gl-live');
    story.st.no3d = true;
    story.apply(story.st.sp, true);
    posters.forEach((p) => p.classList.remove('gone'));
  }

  /* the 3D engine loads after hydration, in its own chunk */
  import('@/lib/buddy/engine')
    .then(({ BuddyEngine }) => {
      if (disposed) return;
      const chips: Chip[] = (reg.hero?.chips ?? []).map((el) => ({
        el,
        at: (el.dataset.at || '0,0,0').split(',').map(Number),
        off: (el.dataset.off || '0,0').split(',').map(Number),
        align: el.dataset.align || 'left',
      }));
      const engine = new BuddyEngine();
      cleanups.push(() => engine.dispose());
      buddy = engine.init({
        story,
        slots: { hero: reg.hero?.slot ?? null, story: storyRefs.glSlot, cta: reg.cta?.slot ?? null },
        stages: { hero: reg.hero?.stage ?? null, cta: reg.cta?.stage ?? null },
        chips: { hero: chips, hi: reg.sayHi ?? null, avoid: reg.hero?.avoid ?? null },
        assets: ASSETS,
        markSvg: brand.mark,
        onReady: () => docEl.classList.add('gl-ready'),
        onFail: no3d,
        onFirstFrame: () => {
          posters.forEach((p) => p.classList.add('gone'));
          docEl.classList.add('gl-live');
        },
      });
      buddy?.resize();
    })
    .catch((err) => {
      if (disposed) return;
      console.error(err);
      no3d();
    });

  /* the canvas lives in whichever studio is on screen (the one showing the most of itself) */
  const studioEls: [Mode, HTMLElement | undefined][] = [
    ['hero', reg.hero?.card],
    ['story', story.sticky],
    ['cta', reg.cta?.card],
  ];
  function pickMode() {
    if (!buddy || !buddy.ready) return;
    const H = innerHeight;
    let best: Mode | null = null, bh = 0;
    for (const [k, el] of studioEls) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const vis = Math.min(r.bottom, H + 60) - Math.max(r.top, -60);
      if (vis > bh) {
        bh = vis;
        best = k;
      }
    }
    buddy.setMode(best);
  }

  /* layout */
  function onResize() {
    if (disposed) return;
    story.layout();
    buddy?.resize();
    fx.resize();
  }
  let rz = 0;
  const scheduleResize = () => {
    cancelAnimationFrame(rz);
    rz = requestAnimationFrame(onResize);
  };
  window.addEventListener('resize', scheduleResize);
  const ro = new ResizeObserver(scheduleResize);
  for (const el of [story.sticky, reg.hero?.card, reg.cta?.card]) if (el) ro.observe(el);
  cleanups.push(() => {
    window.removeEventListener('resize', scheduleResize);
    ro.disconnect();
    cancelAnimationFrame(rz);
  });
  onResize();
  document.fonts?.ready.then(() => {
    if (disposed) return;
    onResize();
    fx.armReveals();
  });
  const armTimer = window.setTimeout(() => fx.armReveals(), 1600);
  cleanups.push(() => clearTimeout(armTimer));

  /* one loop drives the story, the page and the 3D */
  let last = performance.now(), raf = 0;
  function loop(now: number) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(Math.max(0, (now - last) / 1000), window.__buddyDtCap || 0.05);
    last = now;
    story.update(dt);
    fx.tick();
    pickMode();
    if (buddy && buddy.ready && buddy.mode) buddy.frame(dt);
  }
  raf = requestAnimationFrame(loop);
  cleanups.push(() => cancelAnimationFrame(raf));

  /* hooks for rendering stills and automated checks */
  if (hooksEnabled()) {
    window.__buddy = {
      ready: () => !!(buddy && buddy.ready && buddy.firstFrame && buddy.texReady()),
      still: (w, h, extra) => buddy?.still(w, h, extra),
      mode: () => buddy?.mode,
      storyY: (sp) => story.storyY(sp),
      KF: { ...KF },
      no3d: () => docEl.classList.contains('no-3d'),
      landing: () => {
        const t = buddy?.landing();
        const geo = story.st.geo;
        if (!t || !geo) return null;
        const d = story.device.getBoundingClientRect();
        return { tablet: t, device: { x: d.left + geo.bz, y: d.top + geo.bz, w: d.width - 2 * geo.bz, h: d.height - 2 * geo.bz } };
      },
      glowCheck: () => buddy?.glowCheck() ?? null,
      canvases: () => document.querySelectorAll('canvas').length,
    };
    cleanups.push(() => {
      delete window.__buddy;
    });
  }

  return {
    sayHi: () => buddy?.sayHi(),
    dispose() {
      if (disposed) return;
      disposed = true;
      for (let i = cleanups.length - 1; i >= 0; i--) cleanups[i]();
      buddy = null;
      docEl.classList.remove('no-3d', 'gl-live', 'gl-ready', 'over-buddy');
      posters.forEach((p) => p.classList.remove('gone'));
    },
  };
}

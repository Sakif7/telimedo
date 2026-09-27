import { countUp } from '@/lib/count-up';
import { clamp, isFinePointer, motion } from '@/lib/motion';
import type { Story } from '@/lib/story/controller';
import type { ManifestoRefs } from './types';

/* Page-level effects from v1 page.js that stay imperative: in-page links,
   entrance reveals, count-ups, the manifesto ink-in (ticked by the runtime
   loop) and magnetic buttons. Components own the rest
   (header, tabs, billing, FAQ, vignettes, form). */
export function createPageFx({ story, manifesto }: { story: Story | null; manifesto?: ManifestoRefs }) {
  const off: (() => void)[] = [];
  const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement | Document, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    el.addEventListener(type, fn as EventListener);
    off.push(() => el.removeEventListener(type, fn as EventListener));
  };

  /* ------------------------------------------------------------ in-page links */
  // Links to pages that don't exist yet stay put. In-page links scroll smoothly
  // (native), except the story steps, which land on a step.
  on(document, 'click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
    if (!a) return;
    if (a.hasAttribute('data-placeholder-link')) {
      e.preventDefault();
      return;
    }
    const step = a.dataset.step;
    if (step != null && story) {
      e.preventDefault();
      story.jumpToStep(+step);
      return;
    }
    const id = (a.getAttribute('href') || '').slice(1);
    const el = id ? document.getElementById(id) : null;
    if (id === 'top') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: motion.reduce ? 'auto' : 'smooth' });
      return;
    }
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: motion.reduce ? 'auto' : 'smooth', block: 'start' });
    }
  });

  /* ------------------------------------------------------------ reveal on enter (from a visible resting state) */
  const revealEls = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal], [data-split]'));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        if (!motion.reduce) en.target.classList.add('play');
        if (en.target.hasAttribute('data-count-group')) countUp(en.target);
      });
    },
    { rootMargin: '0px 0px 0px 0px', threshold: 0 },
  );
  let armed = false;
  function armReveals() {
    if (armed) return;
    armed = true;
    const H = innerHeight;
    revealEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < H * 0.98) return; // already on screen at load: leave it at rest
      io.observe(el);
    });
    document.querySelectorAll<HTMLElement>('[data-count-group]').forEach((el) => {
      if (!revealEls.includes(el)) io.observe(el);
    });
  }

  /* ------------------------------------------------------------ manifesto: words ink in as you read */
  const mani = manifesto?.text ?? null;
  const maniWords = manifesto?.words ?? [];
  let lastMani = -1;
  if (mani) mani.classList.add('scrub');
  function tickManifesto() {
    if (!mani || !maniWords.length) return;
    const r = mani.getBoundingClientRect(), H = innerHeight;
    if (r.bottom < -50 || r.top > H + 50) return;
    const prog = motion.reduce ? 1 : clamp((H * 0.86 - r.top) / (r.height + H * 0.36));
    if (Math.abs(prog - lastMani) < 0.0015) return;
    lastMani = prog;
    const n = maniWords.length, head = prog * (n + 3);
    for (let i = 0; i < n; i++) maniWords[i].style.setProperty('--k', clamp(head - i, 0, 1).toFixed(3));
  }

  /* ------------------------------------------------------------ fine pointers: magnetic buttons */
  if (isFinePointer()) {
    document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
      on(el, 'pointermove', (e) => {
        if (motion.reduce) return;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${(dx * 0.18).toFixed(1)}px, ${(dy * 0.28).toFixed(1)}px)`;
      });
      on(el, 'pointerleave', () => {
        el.style.transform = '';
      });
    });
  }

  return {
    armReveals,
    tick: tickManifesto,
    resize() {
      lastMani = -1;
    },
    dispose() {
      off.forEach((f) => f());
      io.disconnect();
      if (mani) mani.classList.remove('scrub');
    },
  };
}

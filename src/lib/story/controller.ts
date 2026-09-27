import { clamp, lerp, lerpRect, motion, smooth, type Rect } from '@/lib/motion';
import { computeGeometry, type StoryGeo } from './geometry';
import { COMPACT, DESK, revealOf, STEP_END, STEP_JUMP, STEP_START } from './timeline';

/* The pinned "How it works" controller (v1 story.js, ported without changing
   numbers). React renders every element; this module receives them and writes
   styles and state classes directly, once per frame at most. */

export type StoryRefs = {
  track: HTMLElement;
  sticky: HTMLElement;
  studio: HTMLElement;
  glSlot: HTMLElement;
  rail: HTMLElement;
  head: HTMLElement;
  device: HTMLElement;
  hint: HTMLElement;
  callWrap: HTMLElement;
  call: HTMLElement;
  timer: HTMLElement | null;
  panels: HTMLElement[];
  navBtns: HTMLButtonElement[];
  ecg: HTMLElement;
  ecgSvg: SVGSVGElement;
  ecgBase: SVGPathElement;
  ecgLive: SVGPathElement;
  ecgDot: HTMLElement;
  stepCount: HTMLElement | null;
  ovListen: HTMLElement | null;
  ovCare: HTMLElement | null;
  poster: HTMLElement | null;
  appDesk: HTMLElement;
  appCompact: HTMLElement;
};

export type StoryState = {
  p: number;
  sp: number;
  step: number;
  x: number;
  r: number;
  t: number;
  handoff: number;
  geo: StoryGeo | null;
  compact: boolean;
  visible: boolean;
  studioRect: Rect;
  no3d: boolean;
  deviceLive: boolean;
};

export type Story = ReturnType<typeof createStory>;

export function createStory(refs: StoryRefs, opts: { countLabel: (step: number) => string }) {
  const { track, sticky, studio, glSlot, rail, head, device, hint, callWrap, call, panels, navBtns } = refs;
  const { ecg, ecgSvg, ecgBase, ecgLive, ecgDot, stepCount, ovListen, ovCare, poster, appDesk, appCompact } = refs;

  const st: StoryState = {
    p: 0, sp: 0, step: -1, x: 0, r: 0, t: 0, handoff: 0, geo: null, compact: false, visible: false,
    studioRect: { x: 0, y: 0, w: 1, h: 1 }, no3d: false, deviceLive: false,
  };
  let ecgLen = 1, ecgTable: [number, number, number][] = [], ecgW = 0, lastStudio = '', lastEcg = -1, lastSp = -1;

  /* ------------------------------------------------------------ ECG trace (the progress line) */
  function buildEcg() {
    const w = Math.max(200, Math.round(ecg.clientWidth)), h = 36, col = w / 4;
    if (w === ecgW) return;
    ecgW = w;
    let d = 'M0 24';
    for (let i = 0; i < 4; i++) {
      const c = i * col + 24;
      d += ` L${c - 16} 24 Q${c - 12} 19 ${c - 8} 24 L${c - 4} 24 L${c - 2} 28 L${c + 1} 5 L${c + 4} 31 L${c + 6.5} 24 L${c + 13} 24 Q${c + 19} 16.5 ${c + 25} 24`;
    }
    d += ` L${w} 24`;
    ecgSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    ecgSvg.setAttribute('width', String(w));
    ecgSvg.setAttribute('height', String(h));
    ecgBase.setAttribute('d', d);
    ecgLive.setAttribute('d', d);
    ecgLen = ecgLive.getTotalLength();
    ecgTable = [];
    const N = 240;
    for (let i = 0; i <= N; i++) {
      const L = (ecgLen * i) / N;
      const pt = ecgLive.getPointAtLength(L);
      ecgTable.push([pt.x, L, pt.y]);
    }
    ecgLive.style.strokeDasharray = `${ecgLen} ${ecgLen}`;
    lastEcg = -1;
  }
  function ecgAt(xFrac: number) {
    const X = xFrac * ecgW;
    let lo = 0, hi = ecgTable.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (ecgTable[m][0] < X) lo = m;
      else hi = m;
    }
    const a = ecgTable[lo], b = ecgTable[hi];
    const f = b[0] > a[0] ? clamp((X - a[0]) / (b[0] - a[0])) : 0;
    return { L: lerp(a[1], b[1], f), y: lerp(a[2], b[2], f), x: X };
  }

  /* ------------------------------------------------------------ geometry (container coordinates) */
  function layout() {
    const W = sticky.clientWidth, H = sticky.clientHeight;
    const rootCS = getComputedStyle(document.documentElement);
    const headerSpace = parseFloat(rootCS.getPropertyValue('--header-space')) || 92;
    const geo = computeGeometry(W, H, headerSpace, (width) => {
      head.style.width = width + 'px';
      return head.offsetHeight;
    });
    const compact = geo.compact;
    st.compact = compact;
    st.geo = geo;

    // static placements
    Object.assign(rail.style, { transform: `translate(${geo.rail.x}px, ${geo.rail.y}px)`, width: geo.rail.w + 'px', height: geo.rail.h + 'px' });
    head.style.transform = `translate(${geo.head.x}px, ${geo.head.y}px)`;
    Object.assign(glSlot.style, { width: W + 'px', height: H + 'px' });
    Object.assign(callWrap.style, { left: geo.call.x + 'px', top: geo.call.y + 'px', width: geo.call.w + 'px', height: geo.call.h + 'px' });
    call.classList.toggle('compact', geo.call.w < 560);
    const s1 = geo.studio1;
    Object.assign(device.style, { left: geo.device.x - s1.x + 'px', top: geo.device.y - s1.y + 'px', width: geo.device.w + 'px', height: geo.device.h + 'px' });
    device.style.setProperty('--bz', geo.bz + 'px');
    device.style.setProperty('--r', geo.rad + 'px');
    Object.assign(hint.style, { left: geo.hint.x - s1.x + 'px', top: geo.hint.y - s1.y + 'px', width: geo.hint.w + 'px' });
    const scale = geo.screenW / (compact ? COMPACT.w : DESK.w);
    appDesk.style.transform = `scale(${scale})`;
    appCompact.style.transform = `scale(${scale})`;
    sticky.classList.toggle('is-compact', compact);
    if (poster) {
      const s = geo.stage, ph = s.h * 1.02;
      Object.assign(poster.style, { height: ph + 'px', left: s.x - geo.studio0.x + s.w / 2 + 'px', top: s.y - geo.studio0.y + s.h - ph + 'px' });
    }
    buildEcg();
    lastStudio = '';
    apply(st.sp, true);
  }

  /* ------------------------------------------------------------ per-frame */
  function progressRaw() {
    const tr = track.getBoundingClientRect();
    const L = Math.max(1, tr.height - sticky.offsetHeight);
    st.visible = tr.bottom > -40 && tr.top < innerHeight + 40;
    return clamp(-tr.top / L);
  }
  function update(dt: number) {
    const p = progressRaw();
    st.p = p;
    st.sp = motion.reduce ? p : lerp(st.sp, p, 1 - Math.exp(-dt * 9));
    if (Math.abs(st.sp - p) < 2e-5) st.sp = p;
    if (st.visible && Math.abs(st.sp - lastSp) > 1e-6) apply(st.sp);
  }

  function apply(sp: number, force = false) {
    const geo = st.geo;
    if (!geo) return;
    lastSp = sp;
    const { t, r } = revealOf(sp, motion.reduce);
    st.t = t;
    st.r = r;
    const x = motion.reduce ? (r > 0 ? 1 : 0) : smooth(0, 0.22, r);
    st.x = x;

    // the studio window grows from the right column to the full width, after the text has cleared
    const grow = motion.reduce ? x : smooth(0.12, 1, x);
    const S = lerpRect(geo.studio0, geo.studio1, grow);
    st.studioRect = S;
    const key = `${S.x.toFixed(1)},${S.y.toFixed(1)},${S.w.toFixed(1)},${S.h.toFixed(1)}`;
    if (key !== lastStudio || force) {
      lastStudio = key;
      studio.style.transform = `translate(${S.x}px, ${S.y}px)`;
      studio.style.width = S.w + 'px';
      studio.style.height = S.h + 'px';
      glSlot.style.transform = `translate(${-S.x}px, ${-S.y}px)`;
    }
    const railOut = smooth(0, 0.34, x);
    rail.style.opacity = (1 - railOut).toFixed(3);
    rail.style.visibility = railOut > 0.995 ? 'hidden' : 'visible';
    rail.style.transform = `translate(${geo.rail.x - railOut * 30}px, ${geo.rail.y}px)`;
    const headIn = smooth(0.55, 1, x);
    head.style.opacity = headIn.toFixed(3);
    head.style.visibility = headIn < 0.005 ? 'hidden' : 'visible';
    head.style.transform = `translate(${geo.head.x}px, ${geo.head.y + (1 - headIn) * 14}px)`;

    // active step
    let step = 0;
    for (let i = 0; i < 4; i++) if (sp >= STEP_START[i] - 1e-6) step = i;
    if (step !== st.step) {
      st.step = step;
      const shown = Math.min(step, panels.length - 1);
      panels.forEach((el, i) => {
        el.classList.toggle('on', i === shown);
        el.setAttribute('aria-hidden', String(i !== shown));
      });
      navBtns.forEach((b, i) => {
        b.classList.toggle('on', i === step);
        b.classList.toggle('done', i < step);
        if (i === step) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current');
      });
      if (stepCount) stepCount.textContent = opts.countLabel(step);
      sticky.dataset.step = String(step);
    }

    // heartbeat trace draws along with the visit
    const f = clamp((sp - STEP_START[step]) / (STEP_END[step] - STEP_START[step]));
    const frac = clamp((step + f) / 4, 0, 1);
    if (Math.abs(frac - lastEcg) > 1e-4 && ecgTable.length) {
      lastEcg = frac;
      const e = ecgAt(frac);
      ecgLive.style.strokeDashoffset = (ecgLen - e.L).toFixed(2);
      ecgDot.style.transform = `translate(${e.x.toFixed(1)}px, ${e.y.toFixed(1)}px)`;
    }

    // overlays inside the studio
    ovListen?.classList.toggle('on', sp < 0.11);
    ovCare?.classList.toggle('on', sp > 0.425 && sp < 0.535);

    // hand-off from the flying 3D tablet to the live HTML dashboard
    const handoff = st.no3d ? smooth(0.55, 1, x) : motion.reduce ? (r >= 1 ? 1 : 0) : smooth(0.87, 0.95, r);
    st.handoff = handoff;
    device.style.opacity = handoff.toFixed(3);
    const live = handoff > 0.9;
    if (live !== st.deviceLive) {
      st.deviceLive = live;
      device.style.pointerEvents = live ? 'auto' : 'none';
      device.toggleAttribute('inert', !live);
      hint.classList.toggle('on', live);
    }
  }

  function jumpToStep(i: number) {
    const tr = track.getBoundingClientRect();
    const L = Math.max(1, tr.height - sticky.offsetHeight);
    window.scrollTo({ top: scrollY + tr.top + STEP_JUMP[i] * L, behavior: motion.reduce ? 'auto' : 'smooth' });
  }
  const onNav = navBtns.map((b, i) => {
    const fn = () => jumpToStep(i);
    b.addEventListener('click', fn);
    return fn;
  });
  device.toggleAttribute('inert', true);

  /** Scroll position for a story progress value (test hook and named moments). */
  function storyY(sp: number) {
    const tr = track.getBoundingClientRect();
    const L = tr.height - sticky.offsetHeight;
    return Math.round(scrollY + tr.top + sp * L);
  }

  function dispose() {
    navBtns.forEach((b, i) => b.removeEventListener('click', onNav[i]));
  }

  return { st, layout, update, apply, jumpToStep, storyY, dispose, track, sticky, studio, glSlot, callWrap, call, device, timer: refs.timer };
}

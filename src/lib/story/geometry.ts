import { clamp, type Rect } from '@/lib/motion';
import { COMPACT, DESK } from './timeline';

/* Every box of the pinned story, in container coordinates (the sticky container
   and the canvas share one space). The numbers match the first version of the site. */

export type StoryGeo = {
  W: number;
  H: number;
  compact: boolean;
  /** Device bezel and corner radius (CSS px). */
  bz: number;
  rad: number;
  /** Width of the device screen (the product UI is scaled to it). */
  screenW: number;
  /** The studio before (right column) and after (full width) it widens. */
  studio0: Rect;
  studio1: Rect;
  rail: Rect;
  head: Rect;
  /** Buddy boxes: listen/care stage, lens close-up, dock beside the dashboard. */
  stage: Rect;
  lens: Rect;
  dock: Rect;
  dockHidden?: boolean;
  /** Video call, local to the studio. */
  call: Rect;
  device: Rect;
  hint: { x: number; y: number; w: number };
};

/** measureHead sets the heading row's width and returns its height. */
export function computeGeometry(W: number, H: number, headerSpace: number, measureHead: (width: number) => number): StoryGeo {
  const compact = W < 900;
  if (!compact) {
    const g = clamp(W * 0.044, 16, 72);
    const x0 = Math.max(g, (W - 1440) / 2);
    const inner = W - 2 * x0;
    const top = headerSpace, bottom = H - 20;
    const railW = clamp(inner * 0.34, 340, 480), gap = clamp(inner * 0.03, 28, 48);
    const studio0 = { x: x0 + railW + gap, y: top, w: inner - railW - gap, h: bottom - top };
    const headH = measureHead(inner);
    const s1y = top + headH + 18;
    const studio1 = { x: x0, y: s1y, w: inner, h: bottom - s1y };
    const pad = 28, hintH = 34, bz = 12, rad = 26;
    let sh = studio1.h - pad * 2 - hintH - 2 * bz;
    const sw = Math.min(studio1.w * 0.75 - 2 * bz, sh * (DESK.w / DESK.h));
    sh = sw / (DESK.w / DESK.h);
    const dev = { x: studio1.x + pad, y: studio1.y + pad + Math.max(0, (studio1.h - pad * 2 - hintH - (sh + 2 * bz)) / 2), w: sw + 2 * bz, h: sh + 2 * bz };
    const dx0 = dev.x + dev.w + 12, dx1 = studio1.x + studio1.w - 10;
    return {
      W, H, compact, bz, rad, screenW: sw,
      studio0, studio1,
      rail: { x: x0, y: top, w: railW, h: bottom - top },
      head: { x: x0, y: top, w: inner, h: headH },
      stage: { x: studio0.x + studio0.w * 0.33, y: studio0.y + 34, w: studio0.w * 0.67 - 26, h: studio0.h - 60 },
      lens: { x: studio0.x + 16, y: studio0.y + 16, w: studio0.w - 32, h: studio0.h - 32 },
      call: { x: 14, y: 14, w: studio0.w - 28, h: studio0.h - 28 },
      dock: { x: dx0, y: studio1.y + 24, w: Math.max(80, dx1 - dx0), h: studio1.h - 40 },
      device: dev,
      hint: { x: dev.x, y: dev.y + dev.h + 12, w: dev.w },
    };
  }
  const x0 = 12, inner = W - 24;
  const top = headerSpace;
  const studioH = Math.round(clamp((H - top - 12) * 0.54, 260, 560));
  const studio0 = { x: x0, y: top, w: inner, h: studioH };
  const headH = measureHead(W - 32);
  const s1y = top + headH + 12;
  const studio1 = { x: x0, y: s1y, w: inner, h: H - 12 - s1y };
  const pad = 12, hintH = 28, bz = 9, rad = 22;
  const ar = COMPACT.w / COMPACT.h;
  const sw = Math.min(studio1.w - pad * 2 - 2 * bz, (studio1.h - pad * 2 - hintH - 2 * bz) * ar);
  const sh = sw / ar;
  const devW = sw + 2 * bz, devH = sh + 2 * bz;
  const roomRight = studio1.w - devW - pad * 3;
  const roomBelow = studio1.h - pad * 2 - hintH - devH;
  let dev: Rect, dock: Rect | null;
  if (roomRight > 150) {
    dev = { x: studio1.x + pad, y: studio1.y + pad, w: devW, h: devH };
    dock = { x: dev.x + devW + 8, y: studio1.y + 20, w: studio1.w - devW - pad * 2 - 8, h: studio1.h - 40 };
  } else {
    dev = { x: studio1.x + (studio1.w - devW) / 2, y: studio1.y + pad, w: devW, h: devH };
    dock = roomBelow > 110
      ? { x: studio1.x + studio1.w - 150, y: dev.y + devH + 6, w: 138, h: studio1.h - (dev.y + devH + 6 - studio1.y) - 8 }
      : null;
  }
  return {
    W, H, compact, bz, rad, screenW: sw,
    studio0, studio1,
    rail: { x: 16, y: top + studioH + 16, w: W - 32, h: H - (top + studioH + 16) - 12 },
    head: { x: 16, y: top, w: W - 32, h: headH },
    stage: { x: studio0.x + 10, y: studio0.y + 14, w: studio0.w - 20, h: studio0.h - 24 },
    lens: { x: studio0.x + 10, y: studio0.y + 10, w: studio0.w - 20, h: studio0.h - 20 },
    call: { x: 8, y: 8, w: studio0.w - 16, h: studio0.h - 16 },
    dock: dock || { x: studio0.x + 10, y: studio0.y + 14, w: studio0.w - 20, h: studio0.h - 24 },
    dockHidden: !dock,
    device: dev,
    hint: { x: studio1.x + pad, y: dev.y + devH + 8, w: dock && roomRight <= 150 ? studio1.w - 170 : devW },
  };
}

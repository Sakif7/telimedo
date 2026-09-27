import { clamp } from '@/lib/motion';

/* The pinned "How it works" sequence is driven by one number: the smoothed scroll
   progress through the pinned track (0..1). The 3D buddy reads the same state, so
   the text, the studio window and the camera always agree. Numbers are v1's. */

/** Keyframes, as fractions of the pinned scroll. */
export const KF = { listen: 0, listenHold: 0.08, seeDive: 0.17, seeOpen: 0.26, seeHold: 0.35, care: 0.45, careHold: 0.52, dock: 0.86 } as const;
export const STEP_START = [0, 0.125, 0.4, 0.525];
export const STEP_END = [0.125, 0.4, 0.525, KF.dock];
/** Where the step buttons land. */
export const STEP_JUMP = [0.035, 0.285, 0.47, 0.92];
/** Design sizes of the product UI views shown on the device. */
export const DESK = { w: 1280, h: 800 } as const;
export const COMPACT = { w: 400, h: 580 } as const;

/** Progress through the reveal (careHold to dock): t is linear, r is the eased
    driver with a short hold at each end; reduced motion snaps at the midpoint. */
export function revealOf(sp: number, reduce: boolean) {
  const t = clamp((sp - KF.careHold) / (KF.dock - KF.careHold));
  if (reduce) return { t, r: t < 0.5 ? 0 : 1 };
  return { t, r: clamp((t - 0.04) / 0.92) };
}

/** Named moments used for screenshots and checks (story progress values). */
export const MOMENTS = {
  listen: 0.03,
  seeDive: 0.19,
  portal: 0.225,
  seeOpen: 0.3,
  care: 0.48,
  flip: 0.555,
  flight: 0.64,
  stretch: 0.72,
  handoff: 0.8,
  dock: 0.92,
  unpin: 1.02,
} as const;

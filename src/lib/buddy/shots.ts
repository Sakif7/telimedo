import * as THREE from 'three';
import { KF } from '@/lib/story/timeline';

/* Camera shots and model constants (v1 buddy.js, numbers unchanged). */

export const BODY_C = new THREE.Vector3(0, 1.0, 0);
export const BODY = { h: 2.2, w: 1.62 };
export const LENS_LOCAL = new THREE.Vector3(0, 0.375, 0.34);
export const GLASS_R = 0.2055;
export const LENS_FIT = 0.95;
export const POSTER = { w: 900, h: 1000, extra: 100 };
export const TAB = { w: 0.334, h: 0.424, d: 0.024, r: 0.034, bz: 0.02, center: new THREE.Vector3(-0.167, 0.03, 0) };
export const LEFT_ARM = ['Clavicle_L', 'UpperArm_Helper_L', 'UpperArm_L', 'UpperArm_Twist_L', 'Forearm_L', 'Forearm_Twist_L', 'Hand_L'];
export const GLOW = 0x5fdcf0;

export type PoseName = 'Hello' | 'Rest' | 'Wave' | 'HoldTablet' | 'Caring';
export type ExprName = 'Happy' | 'Wink' | 'Caring' | 'Surprised' | 'Thinking' | 'Joy' | 'Love';
export type Shot = {
  /** Which story box the buddy is fitted into (hero and demo use their stage). */
  rect?: 'stage' | 'lens' | 'dock';
  fit: 'body' | 'lens';
  az: number;
  el: number;
  pose: PoseName;
  expr: ExprName;
  track: number;
  ear: number;
  tilt: number;
  portal: number;
  tablet: number;
  flip: number;
  lookTab?: number;
};
export type ShotName = 'hero' | 'listen' | 'seeDive' | 'seeOpen' | 'care' | 'dock' | 'ctaIn' | 'cta';

const BASE_SHOTS: Record<ShotName, Shot> = {
  hero: { fit: 'body', az: 0.2, el: 0.07, pose: 'Hello', expr: 'Happy', track: 1, ear: 0, tilt: 0, portal: 0, tablet: 1, flip: 0 },
  listen: { rect: 'stage', fit: 'body', az: -0.9, el: 0.07, pose: 'Rest', expr: 'Happy', track: 0.3, ear: 1, tilt: 0.1, portal: 0, tablet: 0, flip: 1 },
  seeDive: { rect: 'lens', fit: 'lens', az: 0, el: 0, pose: 'Rest', expr: 'Happy', track: 0, ear: 0, tilt: 0, portal: 0, tablet: 0, flip: 1 },
  seeOpen: { rect: 'lens', fit: 'lens', az: 0, el: 0, pose: 'Rest', expr: 'Happy', track: 0, ear: 0, tilt: 0, portal: 1, tablet: 0, flip: 1 },
  care: { rect: 'stage', fit: 'body', az: 0.42, el: 0.08, pose: 'HoldTablet', expr: 'Happy', track: 0, lookTab: 1, ear: 0, tilt: 0, portal: 0, tablet: 1, flip: 1 },
  dock: { rect: 'dock', fit: 'body', az: -0.24, el: 0.05, pose: 'Wave', expr: 'Happy', track: 0.8, ear: 0, tilt: 0, portal: 0, tablet: 0, flip: 0 },
  ctaIn: { fit: 'body', az: -0.3, el: 0.06, pose: 'Wave', expr: 'Happy', track: 0.8, ear: 0, tilt: 0, portal: 0, tablet: 0, flip: 0 },
  cta: { fit: 'body', az: -0.16, el: 0.06, pose: 'Caring', expr: 'Caring', track: 0.7, ear: 0, tilt: -0.05, portal: 0, tablet: 0, flip: 0 },
};

/** A fresh copy per engine instance (the engine may fall back to Rest for a missing pose). */
export const makeShots = (): Record<ShotName, Shot> => {
  const out = {} as Record<ShotName, Shot>;
  for (const k of Object.keys(BASE_SHOTS) as ShotName[]) out[k] = { ...BASE_SHOTS[k] };
  return out;
};

export type Anchor = { name: string; y: number; shot: Shot };

/** Story anchors: the camera interpolates between neighbours by story progress. */
export function makeStoryAnchors(SHOTS: Record<ShotName, Shot>): Anchor[] {
  const list: [string, number, ShotName?][] = [
    ['listen', KF.listen], ['listenHold', KF.listenHold, 'listen'], ['seeDive', KF.seeDive], ['seeOpen', KF.seeOpen],
    ['seeHold', KF.seeHold, 'seeOpen'], ['care', KF.care], ['careHold', KF.careHold, 'care'], ['dock', KF.dock], ['dockOut', 1, 'dock'],
  ];
  return list.map(([name, y, shot]) => ({ name, y, shot: SHOTS[(shot || name) as ShotName] }));
}
export const I_CAREHOLD = 6, I_DOCK = 7;

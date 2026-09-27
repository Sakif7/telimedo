import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LEFT_ARM } from './shots';

/* Poses: the model's single-frame actions (Rest, Wave, HoldTablet, Caring), read
   once into per-bone targets (AnimationMixer can't play duration-0 clips) and
   blended by hand. The Anim_* clips are played over them (clips.ts). */

export type BoneTarget = { p: THREE.Vector3; q: THREE.Quaternion; s: THREE.Vector3 };
export type Pose = Record<string, BoneTarget>;
type PartialTarget = { p?: THREE.Vector3; q?: THREE.Quaternion; s?: THREE.Vector3 };

export type Rig = {
  poses: Record<string, Pose>;
  bones: Record<string, THREE.Object3D>;
  boneNames: string[];
  /** Which hand, prop and expression variants show per pose (Rig extras). */
  visMap: Record<string, string[]>;
};

export function readRig(gltf: GLTF, model: THREE.Object3D): Rig {
  const rig = model.getObjectByName('Rig') || model;
  let visMap: Record<string, string[]> = {};
  try {
    visMap = JSON.parse((rig.userData.pose_visibility as string) || '{}');
  } catch {
    visMap = {};
  }
  const raw: Record<string, Record<string, PartialTarget>> = {};
  for (const clip of gltf.animations) {
    if (clip.name.startsWith('Anim_')) continue;
    const P: Record<string, PartialTarget> = {};
    for (const tr of clip.tracks) {
      const dot = tr.name.lastIndexOf('.');
      const node = tr.name.slice(0, dot), prop = tr.name.slice(dot + 1);
      const o = P[node] || (P[node] = {});
      if (prop === 'position') o.p = new THREE.Vector3().fromArray(tr.values, 0);
      else if (prop === 'quaternion') o.q = new THREE.Quaternion().fromArray(tr.values, 0);
      else if (prop === 'scale') o.s = new THREE.Vector3().fromArray(tr.values, 0);
    }
    raw[clip.name] = P;
  }
  const names = new Set<string>();
  Object.values(raw).forEach((P) => Object.keys(P).forEach((n) => names.add(n)));
  const bones: Record<string, THREE.Object3D> = {};
  const boneNames: string[] = [];
  for (const n of names) {
    const b = model.getObjectByName(n);
    if (b) {
      bones[n] = b;
      boneNames.push(n);
    }
  }
  if (!raw.Rest) raw.Rest = {};
  for (const P of Object.values(raw))
    for (const n of boneNames) {
      const o = P[n] || (P[n] = {});
      o.p = o.p || bones[n].position.clone();
      o.q = o.q || bones[n].quaternion.clone();
      o.s = o.s || bones[n].scale.clone();
    }
  const poses = raw as Record<string, Pose>;
  // "Hello": waving right hand (Wave) with the tablet held in the left (HoldTablet)
  const base = poses.Wave || poses.Rest, hold = poses.HoldTablet || poses.Rest;
  poses.Hello = {};
  for (const n of boneNames) poses.Hello[n] = LEFT_ARM.includes(n) ? hold[n] : base[n];
  visMap.Hello = ['Hand_Grip_L', 'Hand_Open_R', 'Expr_Happy'];
  return { poses, bones, boneNames, visMap };
}

export function applyPose(rig: Rig, pa: string, pb: string, w: number) {
  const A = rig.poses[pa] || rig.poses.Rest, B = rig.poses[pb] || rig.poses.Rest;
  for (const n of rig.boneNames) {
    const bone = rig.bones[n], x = A[n], y = B[n];
    bone.position.lerpVectors(x.p, y.p, w);
    bone.quaternion.slerpQuaternions(x.q, y.q, w);
    bone.scale.lerpVectors(x.s, y.s, w);
  }
}

const _pq = new THREE.Quaternion(), _rq = new THREE.Quaternion(), _ax = new THREE.Vector3();
/** Premultiplies a rotation expressed in world space (converted into the parent's space). */
export function rotateWorld(bone: THREE.Object3D | undefined, axisW: THREE.Vector3, angle: number) {
  if (!bone || !angle) return;
  bone.parent!.getWorldQuaternion(_pq);
  _ax.copy(axisW).applyQuaternion(_pq.invert()).normalize();
  _rq.setFromAxisAngle(_ax, angle);
  bone.quaternion.premultiply(_rq);
}

/** Two-bump heartbeat, period 1.05 s. */
export function heartbeat(t: number) {
  const p = t % 1.05;
  const g = (x: number, c: number, w: number) => Math.exp(-((x - c) ** 2) / (2 * w * w));
  return g(p, 0.1, 0.045) + 0.6 * g(p, 0.3, 0.05);
}

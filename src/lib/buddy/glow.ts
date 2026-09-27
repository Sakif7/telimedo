import * as THREE from 'three';
import { GLOW } from './shots';

/* Glow that sits on the surface. The v0 halo was a flat card floating in front
   of the face, so it slid off the lens as the head turned. These rings are built
   by casting rays at the head itself and placing every vertex a hair above the
   surface they land on, so the light stays glued to the rim and the ear pads
   from any angle. */

export function radialTexture(stops: [number, number][]) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [o, a] of stops) grd.addColorStop(o, `rgba(255,255,255,${a})`);
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const glowMaterial = (tex: THREE.Texture, color: THREE.ColorRepresentation, opacity: number) =>
  new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false, toneMapped: false });

export type RingSpec = {
  /** Plane centre, normal and axes, in Head_Mesh space. */
  c: THREE.Vector3;
  n: THREE.Vector3;
  u: THREE.Vector3;
  v: THREE.Vector3;
  r0: number;
  r1: number;
  segA?: number;
  segR?: number;
  profile: (r: number) => number;
  offset?: number;
};

export function conformRing(headMesh: THREE.Object3D, targets: THREE.Object3D[], { c, n, u, v, r0, r1, segA = 84, segR = 8, profile, offset = 0.0022 }: RingSpec) {
  headMesh.updateMatrixWorld(true);
  const mW = headMesh.matrixWorld, inv = new THREE.Matrix4().copy(mW).invert();
  const dirW = n.clone().transformDirection(mW).negate();
  const rc = new THREE.Raycaster();
  const pos: number[] = [], alpha: number[] = [], idx: number[] = [];
  const pL = new THREE.Vector3(), oW = new THREE.Vector3(), fn = new THREE.Vector3();
  for (let j = 0; j <= segR; j++) {
    const r = r0 + (r1 - r0) * (j / segR);
    for (let i = 0; i < segA; i++) {
      const ang = (i / segA) * Math.PI * 2;
      pL.copy(c).addScaledVector(u, Math.cos(ang) * r).addScaledVector(v, Math.sin(ang) * r);
      oW.copy(pL).addScaledVector(n, 0.5).applyMatrix4(mW);
      rc.set(oW, dirW);
      const hit = rc.intersectObjects(targets, false)[0];
      let a = profile(r);
      if (hit && hit.face) {
        const q = hit.point.clone().applyMatrix4(inv);
        fn.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).transformDirection(inv);
        if (fn.dot(n) < 0.05) fn.copy(n);
        q.addScaledVector(fn, offset);
        pos.push(q.x, q.y, q.z);
      } else {
        pos.push(pL.x, pL.y, pL.z);
        a = 0;
      }
      alpha.push(a);
    }
  }
  for (let j = 0; j < segR; j++)
    for (let i = 0; i < segA; i++) {
      const i2 = (i + 1) % segA;
      const A = j * segA + i, B = j * segA + i2, C = (j + 1) * segA + i, D = (j + 1) * segA + i2;
      idx.push(A, B, C, B, D, C);
    }
  const col = new THREE.Color(GLOW);
  const colors: number[] = [];
  for (const a of alpha) colors.push(col.r, col.g, col.b, a);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

export const decalMaterial = (opacity: number) =>
  new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity, depthWrite: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6,
  });

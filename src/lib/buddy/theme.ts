import type * as THREE from 'three';

/* Scene theme: the CSS variable --scene-mode (light or dark) decides pedestal,
   shadow, glow, environment and rim-light values. Read on load and whenever the
   colour scheme or data-theme changes. */

export const isDarkScene = (root: HTMLElement) => getComputedStyle(root).getPropertyValue('--scene-mode').trim() === 'dark';

export type ThemeTargets = {
  scene: THREE.Scene;
  rimA: THREE.DirectionalLight;
  rimC: THREE.DirectionalLight;
  shadowMat?: THREE.MeshBasicMaterial;
  pedestal?: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
  pedestalRing?: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  lensGlowMat?: THREE.MeshBasicMaterial;
};

export function applyTheme(dark: boolean, t: ThemeTargets) {
  if (t.shadowMat) {
    t.shadowMat.color.set(dark ? 0x000000 : 0x16303a);
    t.shadowMat.opacity = dark ? 0.7 : 0.85;
  }
  if (t.pedestal) {
    t.pedestal.material.color.set(dark ? 0x18272e : 0xf7fbfc);
    t.pedestal.material.roughness = dark ? 0.32 : 0.42;
  }
  if (t.pedestalRing) t.pedestalRing.material.opacity = dark ? 0.9 : 0.5;
  if (t.lensGlowMat) t.lensGlowMat.opacity = dark ? 0.95 : 0.8;
  t.scene.environmentIntensity = dark ? 0.82 : 0.95;
  t.rimA.intensity = dark ? 3.2 : 2.2;
  t.rimC.intensity = dark ? 1.6 : 1.0;
}

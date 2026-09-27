import * as THREE from 'three';

/* Studio pedestal: a lathed disc (radius 0.78, height 0.07, rounded 0.026 edge)
   with a thin aqua ring on its top edge. */
export function buildPedestal(scene: THREE.Scene) {
  const R = 0.78, Hh = 0.07, e = 0.026, pts: THREE.Vector2[] = [];
  pts.push(new THREE.Vector2(0.0001, 0));
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI / 2 - (i / 8) * (Math.PI / 2);
    pts.push(new THREE.Vector2(R - e + Math.cos(a) * e, -e + Math.sin(a) * e));
  }
  for (let i = 0; i <= 8; i++) {
    const a = -(i / 8) * (Math.PI / 2);
    pts.push(new THREE.Vector2(R - e + Math.cos(a) * e, -Hh + e + Math.sin(a) * e));
  }
  pts.push(new THREE.Vector2(0.0001, -Hh));
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xf6fbfc, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.25 });
  const pedestal = new THREE.Mesh(new THREE.LatheGeometry(pts.reverse(), 120), mat);
  scene.add(pedestal);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(R - 0.012, 0.0042, 8, 200),
    new THREE.MeshBasicMaterial({ color: 0x4fc3d9, transparent: true, opacity: 0.55, toneMapped: false }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.006;
  scene.add(ring);
  return { pedestal, ring };
}

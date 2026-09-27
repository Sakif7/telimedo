import * as THREE from 'three';
import { COMPACT, DESK } from '@/lib/story/timeline';
import { TAB } from './shots';

/* The tablet, built in code so it can stretch into the device box: a rounded
   extruded slab, a dark glass plane, a screen plane (SDF rounded rectangle with
   cover-fit UVs crossfading from the phone to the desktop texture) and a back
   decal drawn from the mark SVG. */

type RoundedUniforms = {
  uSize: THREE.IUniform<THREE.Vector2>;
  uRadius: THREE.IUniform<number>;
  uColor: THREE.IUniform<THREE.Color>;
  uMapA: THREE.IUniform<THREE.Texture | null>;
  uMapB: THREE.IUniform<THREE.Texture | null>;
  uMix: THREE.IUniform<number>;
  uUseMap: THREE.IUniform<number>;
  uAspA: THREE.IUniform<number>;
  uAspB: THREE.IUniform<number>;
  uOpacity: THREE.IUniform<number>;
};
export type RoundedMaterial = THREE.ShaderMaterial & { uniforms: RoundedUniforms };

const roundedPlane = (color: THREE.ColorRepresentation, useMap: boolean) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uSize: { value: new THREE.Vector2(1, 1) }, uRadius: { value: 0.02 }, uColor: { value: new THREE.Color(color) },
      uMapA: { value: null }, uMapB: { value: null }, uMix: { value: 0 }, uUseMap: { value: useMap ? 1 : 0 },
      uAspA: { value: COMPACT.w / COMPACT.h }, uAspB: { value: DESK.w / DESK.h }, uOpacity: { value: 1 },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform vec2 uSize; uniform float uRadius; uniform vec3 uColor; uniform sampler2D uMapA; uniform sampler2D uMapB;
      uniform float uMix; uniform float uUseMap; uniform float uAspA; uniform float uAspB; uniform float uOpacity;
      varying vec2 vUv;
      vec2 cover(vec2 uv, float pa, float ta) { vec2 s = pa > ta ? vec2(1.0, ta / pa) : vec2(pa / ta, 1.0); return (uv - 0.5) * s + 0.5; }
      float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
      void main() {
        vec2 p = (vUv - 0.5) * uSize;
        float d = sdRound(p, uSize * 0.5, min(uRadius, min(uSize.x, uSize.y) * 0.5));
        float aa = max(fwidth(d), 1e-5);
        float a = 1.0 - smoothstep(-aa, aa, d);
        vec3 col = uColor;
        if (uUseMap > 0.5) {
          float pa = uSize.x / uSize.y;
          vec3 ca = texture2D(uMapA, cover(vUv, pa, uAspA)).rgb;
          vec3 cb = texture2D(uMapB, cover(vUv, pa, uAspB)).rgb;
          col = mix(ca, cb, uMix);
        }
        gl_FragColor = vec4(col, a * uOpacity);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false,
  }) as RoundedMaterial;

/** The mark drawn onto a canvas, without its white rounded square, for the tablet's back. */
function markTexture(markSvg: string) {
  const vb = ((markSvg.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 1 1').split(/\s+/).map(Number);
  const S = 512, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const k = S / vb[2];
  g.setTransform(k, 0, 0, k, -vb[0] * k, -vb[1] * k);
  const attr = (el: string, n: string) => {
    const m = el.match(new RegExp(`\\s${n}="([^"]*)"`));
    return m ? m[1] : null;
  };
  const els = markSvg.match(/<(rect|circle|polyline)[^>]*>/g) || [];
  els.forEach((el, i) => {
    if (i === 0 && el.startsWith('<rect')) return;
    const fill = attr(el, 'fill'), stroke = attr(el, 'stroke'), sw = +(attr(el, 'stroke-width') ?? 0) || 0;
    g.beginPath();
    if (el.startsWith('<rect')) {
      const x = +attr(el, 'x')!, y = +attr(el, 'y')!, w = +attr(el, 'width')!, h = +attr(el, 'height')!, r = +(attr(el, 'rx') ?? 0) || 0;
      if (g.roundRect) g.roundRect(x, y, w, h, r);
      else g.rect(x, y, w, h);
    } else if (el.startsWith('<circle')) {
      g.arc(+attr(el, 'cx')!, +attr(el, 'cy')!, +attr(el, 'r')!, 0, Math.PI * 2);
    } else {
      const pts = attr(el, 'points')!.trim().split(/\s+/).map((p) => p.split(',').map(Number));
      pts.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y)));
    }
    if (fill && fill !== 'none') {
      g.fillStyle = fill;
      g.fill();
    }
    if (stroke && stroke !== 'none') {
      g.strokeStyle = stroke;
      g.lineWidth = sw;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.stroke();
    }
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function roundedShape(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x = w / 2, y = h / 2;
  r = Math.min(r, x, y);
  s.moveTo(-x + r, -y);
  s.lineTo(x - r, -y);
  s.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x, y - r);
  s.absarc(x - r, y - r, r, 0, Math.PI / 2, false);
  s.lineTo(-x + r, y);
  s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-x, -y + r);
  s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

export type Tablet = {
  root: THREE.Group;
  body: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
  glass: THREE.Mesh<THREE.PlaneGeometry, RoundedMaterial>;
  screen: THREE.Mesh<THREE.PlaneGeometry, RoundedMaterial>;
  decal: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  dims: { w: number; h: number; d: number; r: number; bz: number } | null;
  presence: number;
};

export function setTabletDims(tablet: Tablet, w: number, h: number, d: number, r: number, bz: number) {
  const p = tablet.dims;
  if (!p || Math.abs(p.w - w) > 1e-4 || Math.abs(p.h - h) > 1e-4 || Math.abs(p.d - d) > 1e-4 || Math.abs(p.r - r) > 1e-4) {
    const bev = Math.min(0.006, d * 0.3);
    const g = new THREE.ExtrudeGeometry(roundedShape(w - 2 * bev, h - 2 * bev, Math.max(0.002, r - bev)), {
      depth: Math.max(0.0004, d - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 10,
    });
    g.translate(0, 0, -(d - 2 * bev) / 2);
    tablet.body.geometry.dispose();
    tablet.body.geometry = g;
  }
  tablet.dims = { w, h, d, r, bz };
  const rim = Math.min(0.004, bz * 0.2);
  tablet.glass.scale.set(w - 2 * rim, h - 2 * rim, 1);
  tablet.glass.position.z = d / 2 + 0.0006;
  tablet.glass.material.uniforms.uSize.value.set(w - 2 * rim, h - 2 * rim);
  tablet.glass.material.uniforms.uRadius.value = Math.max(0.001, r - rim);
  const sw = Math.max(0.01, w - 2 * bz), sh = Math.max(0.01, h - 2 * bz);
  tablet.screen.scale.set(sw, sh, 1);
  tablet.screen.position.z = d / 2 + 0.0012;
  tablet.screen.material.uniforms.uSize.value.set(sw, sh);
  tablet.screen.material.uniforms.uRadius.value = Math.max(0.001, r - bz);
  const ds = Math.min(w, h) * 0.34;
  tablet.decal.scale.set(ds, ds, 1);
  tablet.decal.position.z = -d / 2 - 0.0006;
}

export function buildTablet(scene: THREE.Scene, tex: { desk: THREE.Texture | null; compact: THREE.Texture | null }, markSvg: string): Tablet {
  const white = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.05 });
  const tablet: Tablet = {
    root: new THREE.Group(),
    body: new THREE.Mesh(new THREE.BufferGeometry(), white),
    glass: new THREE.Mesh(new THREE.PlaneGeometry(1, 1), roundedPlane(0x141d22, false)),
    screen: new THREE.Mesh(new THREE.PlaneGeometry(1, 1), roundedPlane(0xf4f8f9, true)),
    decal: new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: markTexture(markSvg), transparent: true, depthWrite: false, toneMapped: false })),
    dims: null,
    presence: 0,
  };
  tablet.decal.rotation.y = Math.PI;
  tablet.glass.renderOrder = 2;
  tablet.screen.renderOrder = 3;
  tablet.decal.renderOrder = 2;
  tablet.screen.material.uniforms.uMapA.value = tex.compact;
  tablet.screen.material.uniforms.uMapB.value = tex.desk || tex.compact;
  tablet.root.add(tablet.body, tablet.glass, tablet.screen, tablet.decal);
  setTabletDims(tablet, TAB.w, TAB.h, TAB.d, TAB.r, TAB.bz);
  scene.add(tablet.root);
  return tablet;
}

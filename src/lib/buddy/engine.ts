import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { clamp, easeInOut, easeOutBack, easeOutCubic, lerp, lerpRect, motion, smooth, type Rect } from '@/lib/motion';
import type { Story } from '@/lib/story/controller';
import { conformRing, decalMaterial, glowMaterial, radialTexture } from './glow';
import { buildPedestal } from './pedestal';
import { applyPose, heartbeat, readRig, rotateWorld, type Rig } from './poses';
import { createPortal } from './portal';
import { BODY, BODY_C, I_CAREHOLD, I_DOCK, LENS_FIT, LENS_LOCAL, makeShots, makeStoryAnchors, POSTER, TAB, type ExprName, type Shot, type ShotName } from './shots';
import { buildTablet, setTabletDims, type Tablet } from './tablet';
import { applyTheme, isDarkScene } from './theme';

/* The three.js engine (v1 buddy.js, ported without changing numbers): model,
   poses, shots, camera fitting, glow, pedestal, tablet flight, lens portal, hero
   chips and pointer. One canvas moves between the studio slots; the runtime's
   single rAF loop calls frame(). dispose() releases everything.
   The first studio ("hero": the home hero, or the studio on other pages) can use
   another shot, and the first time it is shown the buddy peeks in from its bottom
   edge before rising into place (the intro). Pages without the story pass none. */

export type Mode = 'hero' | 'story' | 'cta';
/** An element anchored to a 3D point: `align` which side sits on the point (left/right), `valign` whether it is centred on it or sits above it (bottom). */
export type Chip = { el: HTMLElement; at: number[]; off: number[]; align: string; valign?: string; hidden?: boolean };

export type EngineOptions = {
  story: Story | null;
  slots: Record<Mode, HTMLElement | null>;
  stages: { hero: HTMLElement | null; cta: HTMLElement | null };
  chips: { hero: Chip[]; cta?: Chip[]; hi: HTMLElement | null; avoid: HTMLElement | null };
  assets: { model: string; decoder: string; desk: string; compact: string };
  /** Raw mark SVG, drawn on the back of the tablet. */
  markSvg: string;
  /** The first studio's shot: 'hero' on the home page, another pose on other pages. */
  heroShot?: ShotName;
  /** Asked when the first studio is first shown: play the intro? (not with reduced motion or a late start) */
  intro?: () => boolean;
  /** The buddy is in place: after the intro, or straight away without one. */
  onIntroDone?: () => void;
  onReady?: () => void;
  onFail: () => void;
  onFirstFrame?: () => void;
};

export type Buddy = NonNullable<ReturnType<typeof createBuddy>>;

/** WebGL2 is required by three.js; probing first keeps the no-WebGL fallback free of console errors. */
function webgl2Available() {
  try {
    const probe = document.createElement('canvas').getContext('webgl2');
    if (!probe) return false;
    probe.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Pointer targets that belong to the page, not to the buddy. */
const INTERACTIVE = 'a, button, input, textarea, select, label, form, [data-interactive]';

export function createBuddy({ story, slots, stages, chips, assets, markSvg, heroShot = 'hero', intro, onIntroDone, onReady, onFail, onFirstFrame }: EngineOptions) {
  if (!webgl2Available()) {
    onFail();
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.className = 'gl';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer: THREE.WebGLRenderer | null = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch {
    renderer = null;
  }
  if (!renderer) {
    onFail();
    return null;
  }
  const R = renderer;

  const docEl = document.documentElement;
  let W = 1, H = 1, mode: Mode | null = null, ready = false, failed = false, firstFrame = false, disposed = false;
  const SHOTS = makeShots();
  const STORY = makeStoryAnchors(SHOTS);
  const HERO = SHOTS[heroShot];
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, 1, 0.05, 80);
  const TAN_HALF = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  const rimA = new THREE.DirectionalLight(0xa9ecf6, 2.2);
  const rimC = new THREE.DirectionalLight(0xffb4ad, 1.1);
  scene.add(camera, key, key.target, rimA, rimA.target, rimC, rimC.target);

  R.setClearColor(0x000000, 0);
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.NeutralToneMapping;
  const pmrem = new THREE.PMREMGenerator(R);
  const room = new RoomEnvironment();
  // three r171+ lowers the room by 3.5 units; v1's lighting was art-directed on the
  // original layout (r170), so capture it from the same place.
  room.position.y = 0;
  const envRT = pmrem.fromScene(room, 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.95;
  pmrem.dispose();
  room.dispose();
  const onContextLost = (e: Event) => {
    e.preventDefault();
    fail();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  function fail() {
    if (failed) return;
    failed = true;
    ready = false;
    canvas.remove();
    onFail();
  }

  const texLoader = new THREE.TextureLoader();
  const TEX: { desk: THREE.Texture | null; compact: THREE.Texture | null } = { desk: null, compact: null };
  const loadTex = (k: 'desk' | 'compact', src: string) => {
    const t = texLoader.load(src, (tx) => {
      tx.needsUpdate = true;
    });
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, R.capabilities.getMaxAnisotropy());
    TEX[k] = t;
  };
  loadTex('desk', assets.desk);
  loadTex('compact', assets.compact);

  let model!: THREE.Object3D, headMesh!: THREE.Object3D, socketL!: THREE.Object3D, rig!: Rig;
  const hands: Record<string, THREE.Object3D> = {}, exprs: Record<string, THREE.Object3D> = {};
  const propState: Record<string, { obj: THREE.Object3D; p: number; target: number }> = {};
  let earMat: THREE.MeshStandardMaterial | null = null, earGlowMat!: THREE.MeshBasicMaterial, lensGlowMat: THREE.MeshBasicMaterial | undefined;
  let exprGlow!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>, shadowMat: THREE.MeshBasicMaterial | undefined;
  let pedestal: ReturnType<typeof buildPedestal>['pedestal'] | undefined, pedestalRing: ReturnType<typeof buildPedestal>['ring'] | undefined;
  const rings: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>[] = [];
  let tablet!: Tablet;
  let lensGlow: THREE.Mesh | null = null, lensRimObj: THREE.Object3D | null = null;

  const draco = new DRACOLoader().setDecoderPath(assets.decoder);
  new GLTFLoader().setDRACOLoader(draco).load(
    assets.model,
    (gltf) => {
      draco.dispose();
      onModel(gltf);
    },
    undefined,
    (err) => {
      draco.dispose();
      if (disposed) return;
      console.error(err);
      fail();
    },
  );

  /* ================================================================ model setup */
  function onModel(gltf: GLTF) {
    if (failed || disposed) return;
    model = gltf.scene;
    scene.add(model);
    rig = readRig(gltf, model);
    for (const k of Object.keys(SHOTS) as (keyof typeof SHOTS)[]) if (!rig.poses[SHOTS[k].pose]) SHOTS[k].pose = 'Rest';

    for (const n of ['Hand_Grip_L', 'Hand_Open_L', 'Hand_Relaxed_L', 'Hand_Grip_R', 'Hand_Open_R', 'Hand_Relaxed_R']) {
      const o = model.getObjectByName(n);
      if (o) hands[n] = o;
    }
    const oldTablet = model.getObjectByName('Prop_Tablet');
    if (oldTablet) oldTablet.visible = false;
    const heart = model.getObjectByName('Prop_Heart');
    if (heart) propState.Prop_Heart = { obj: heart, p: 0, target: 0 };
    for (const n of ['Happy', 'Wink', 'Caring']) {
      const o = model.getObjectByName('Expr_' + n);
      if (o) exprs[n] = o;
    }
    headMesh = model.getObjectByName('Head_Mesh') || rig.bones.Head;
    socketL = model.getObjectByName('Socket_Hand_L') || rig.bones.Hand_L;

    const glowMats = new Set<THREE.MeshStandardMaterial>();
    model.traverse((obj) => {
      const o = obj as THREE.Mesh;
      if (!o.isMesh) return;
      if ((o as THREE.SkinnedMesh).isSkinnedMesh) o.frustumCulled = false;
      const m = o.material as THREE.MeshPhysicalMaterial;
      if (!m) return;
      if (m.name.startsWith('MAT_Glow') || m.name === 'MAT_Lens_RingGlow') glowMats.add(m);
      if (m.name === 'MAT_Lens_Glass') {
        m.opacity = 0.3;
        m.depthWrite = false;
        m.iridescence = 0.55;
      }
      if (m.name === 'MAT_Lens_Bezel') m.envMapIntensity = 0.7;
    });
    for (const m of glowMats) {
      m.toneMapped = false;
      m.color.setRGB(0.02, 0.02, 0.02);
      m.emissiveIntensity = 1.0;
    }
    const earR = model.getObjectByName('EarPad_R_Glow') as THREE.Mesh | undefined, earL = model.getObjectByName('EarPad_L_Glow') as THREE.Mesh | undefined;
    if (earR && earL) {
      earMat = (earR.material as THREE.MeshStandardMaterial).clone();
      earR.material = earMat;
      earL.material = earMat;
    }

    // Glow that hugs the lens rim and spills onto the face.
    model.updateMatrixWorld(true);
    const lensRim = model.getObjectByName('Lens_Rim');
    const rimR = 0.278;
    lensGlowMat = decalMaterial(0.9);
    const lensRing = new THREE.Mesh(
      conformRing(headMesh, [headMesh, lensRim].filter(Boolean) as THREE.Object3D[], {
        c: new THREE.Vector3(0, 0.375, 0), n: new THREE.Vector3(0, 0, 1), u: new THREE.Vector3(1, 0, 0), v: new THREE.Vector3(0, 1, 0),
        r0: 0.268, r1: 0.35, segA: 96, segR: 9,
        profile: (r) => (r < rimR ? smooth(0.268, rimR + 0.002, r) * 0.7 : 0.85 * Math.exp(-Math.pow((r - rimR) / 0.024, 1.25))),
      }),
      lensGlowMat,
    );
    lensRing.renderOrder = 4;
    headMesh.add(lensRing);
    lensGlow = lensRing;
    lensRimObj = lensRim ?? null;
    // ... and around each ear pad, on the side of the head.
    earGlowMat = decalMaterial(0.5);
    for (const sx of [1, -1]) {
      const pad = model.getObjectByName(sx > 0 ? 'EarPad_L' : 'EarPad_R');
      const cx = pad ? pad.position.x : 0.507 * sx;
      const ring = new THREE.Mesh(
        conformRing(headMesh, [headMesh], {
          c: new THREE.Vector3(cx, 0.375, 0), n: new THREE.Vector3(sx, 0, 0), u: new THREE.Vector3(0, 1, 0), v: new THREE.Vector3(0, 0, 1),
          r0: 0.226, r1: 0.305, segA: 84, segR: 7,
          profile: (r) => smooth(0.226, 0.234, r) * Math.exp(-Math.pow(Math.max(0, r - 0.234) / 0.024, 1.2)),
        }),
        earGlowMat,
      );
      ring.renderOrder = 4;
      headMesh.add(ring);
    }
    // soft light on the face display, sitting on the display itself (behind the glass)
    exprGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), glowMaterial(radialTexture([[0, 0.55], [0.3, 0.32], [0.62, 0.1], [0.9, 0.02], [1, 0]]), 0x4fc3d9, 0.5));
    exprGlow.position.set(0, 0.375, 0.2705);
    headMesh.add(exprGlow);
    // a small specular glint on the glass
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false });
    const glint = new THREE.Mesh(new THREE.RingGeometry(0.128, 0.142, 40, 1, Math.PI * 0.56, Math.PI * 0.3), glintMat);
    glint.position.set(0, 0.375, 0.303);
    headMesh.add(glint);
    const glintDot = new THREE.Mesh(new THREE.CircleGeometry(0.01, 20), glintMat);
    glintDot.position.set(-0.098, 0.482, 0.303);
    headMesh.add(glintDot);
    // sound rings for "listening"
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.212, 64), new THREE.MeshBasicMaterial({ color: 0x4fc3d9, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
      r.position.set(-0.64, 0.375, 0);
      r.rotation.y = Math.PI / 2;
      r.visible = false;
      headMesh.add(r);
      rings.push(r);
    }
    shadowMat = new THREE.MeshBasicMaterial({ map: radialTexture([[0, 0.4], [0.35, 0.26], [0.7, 0.08], [1, 0]]), color: 0x16303a, transparent: true, depthWrite: false, toneMapped: false });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.002;
    shadow.renderOrder = 1;
    scene.add(shadow);

    const ped = buildPedestal(scene);
    pedestal = ped.pedestal;
    pedestalRing = ped.ring;
    tablet = buildTablet(scene, TEX, markSvg);
    readTheme();
    resize();
    ready = true;
    R.compile(scene, camera);
    onReady?.();
  }

  /* ================================================================ theme */
  function readTheme() {
    applyTheme(isDarkScene(docEl), { scene, rimA, rimC, shadowMat, pedestal, pedestalRing, lensGlowMat });
  }
  const mqDark = window.matchMedia('(prefers-color-scheme: dark)');
  mqDark.addEventListener('change', readTheme);
  const themeObserver = new MutationObserver(readTheme);
  themeObserver.observe(docEl, { attributes: true, attributeFilter: ['data-theme'] });

  /* ================================================================ pointer, hover and tap */
  let pointer: { x: number; y: number; type: string; busy: boolean } | null = null;
  const onPointerMove = (e: PointerEvent) => {
    const t = e.target as Element | null;
    pointer = { x: e.clientX, y: e.clientY, type: e.pointerType, busy: !!t?.closest?.(INTERACTIVE) };
  };
  const onMouseLeave = () => {
    pointer = null;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  docEl.addEventListener('mouseleave', onMouseLeave);
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const tapTargets: THREE.Object3D[] = [];
  let canvasRect: { left: number; top: number; width: number; height: number } = { left: 0, top: 0, width: 1, height: 1 }, hovering = false;
  function hitBuddy(cx: number, cy: number) {
    if (!ready || !mode) return false;
    if (!tapTargets.length)
      headMesh.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh && !(m.material as THREE.Material).vertexColors) tapTargets.push(m);
      });
    const x = cx - canvasRect.left, y = cy - canvasRect.top;
    if (x < 0 || y < 0 || x > canvasRect.width || y > canvasRect.height) return false;
    ndc.set((x / W) * 2 - 1, -(y / H) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(tapTargets, false).length > 0;
  }
  const onPointerDown = (e: PointerEvent) => {
    const t = e.target as Element | null;
    if (!ready || e.button > 0 || t?.closest?.(INTERACTIVE)) return;
    canvasRect = canvas.getBoundingClientRect();
    if (hitBuddy(e.clientX, e.clientY)) sayHi();
  };
  window.addEventListener('pointerdown', onPointerDown);

  let time = 0, introDone = false;
  /* intro: hidden below the studio's bottom edge, the head peeks up and looks around, then he rises (seconds) */
  const INTRO = { peek: 0.6, look: 1.1, rise: 0.8 };
  const INTRO_LEN = INTRO.peek + INTRO.look + INTRO.rise;
  let introStart = -1, introWaiting = false, introBlinked = false;
  let waveStart = -10, waveEnd = -10, nextAutoWave = 1e9, winkUntil = -1, hopStart = -10, currentWaveW = 0;
  function triggerWave(dur: number) {
    waveStart = time;
    waveEnd = time + dur;
  }
  function sayHi() {
    winkUntil = time + 1.2;
    if (currentWaveW > 0.5) triggerWave(1.9);
    else hopStart = time;
  }

  /* ================================================================ modes: the canvas lives in whichever studio is on screen */
  const rects: { hero: Rect | null; cta: Rect | null; avoidHero: Rect | null } = { hero: null, cta: null, avoidHero: null };
  function relRect(el: Element, parent: Element): Rect {
    const a = el.getBoundingClientRect(), b = parent.getBoundingClientRect();
    return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
  }
  function measure() {
    if (stages.hero && slots.hero) rects.hero = relRect(stages.hero, slots.hero);
    if (stages.cta && slots.cta) rects.cta = relRect(stages.cta, slots.cta);
    if (chips.avoid && slots.hero) rects.avoidHero = relRect(chips.avoid, slots.hero);
  }
  function resize() {
    if (disposed) return;
    measure();
    if (!mode) return;
    const slot = slots[mode]!;
    W = Math.max(1, slot.clientWidth);
    H = Math.max(1, slot.clientHeight);
    // keep the pixel budget sane for full-screen studios on high-density screens
    const budget = Math.sqrt(4.2e6 / (W * H));
    R.setPixelRatio(Math.max(1, Math.min(window.devicePixelRatio || 1, 2, budget)));
    R.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }
  function setMode(m: Mode | null) {
    if (m === mode || failed) return;
    mode = m;
    if (!m) return;
    const slot = slots[m];
    if (!slot) return;
    if (canvas.parentNode !== slot) slot.appendChild(canvas);
    resize();
    // entering a studio: start from its own resting state
    for (const n in propState) propState[n].p = 0;
    tablet.presence = m === 'hero' && HERO.tablet ? 1 : 0;
    if (!introDone) {
      // the intro only plays when the first studio is the first thing he appears in
      introDone = true;
      if (m === 'hero' && intro?.()) {
        introWaiting = true;
        nextAutoWave = 1e9;
      } else {
        nextAutoWave = time + 1.1;
        onIntroDone?.();
      }
    } else if (nextAutoWave > 1e8) nextAutoWave = time + 1.5;
  }
  // Where the hero poster sits (mirrors the camera fit).
  function posterPlacement() {
    const r = rects.hero;
    if (!r) return null;
    const ppu = Math.min(r.h / BODY.h, r.w / BODY.w);
    const s = ppu / (POSTER.h / BODY.h);
    return { h: (POSTER.h + POSTER.extra) * s, top: r.y + r.h / 2 - (POSTER.h / 2) * s, left: r.x + r.w / 2 };
  }

  /* ================================================================ frame */
  const target = new THREE.Vector3(), lensWorld = new THREE.Vector3(), headPos = new THREE.Vector3(), lookP = new THREE.Vector3();
  const up = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3();
  const rootQ = new THREE.Quaternion(), rootQInv = new THREE.Quaternion();
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
  const tabPosA = new THREE.Vector3(), tabQA = new THREE.Quaternion(), tabPosT = new THREE.Vector3(), tabScl = new THREE.Vector3();
  const mTmp = new THREE.Matrix4(), mLocal = new THREE.Matrix4(), qFlip = new THREE.Quaternion();
  const look = { yaw: 0, pitch: 0 };
  const BLUE = new THREE.Color(0x4fc3d9), CORAL = new THREE.Color(0xff6f6f);
  let exprShown: ExprName = 'Happy', blink: { active: boolean; t0: number; swap: ExprName | null } = { active: false, t0: 0, swap: null }, nextBlink = 3;
  let dockWinked = false;
  const portal = story ? createPortal(story) : null;
  const fitOf = (s: Shot) => (s.fit === 'lens' ? { c: lensWorld, h: LENS_FIT, w: LENS_FIT } : { c: BODY_C, h: BODY.h, w: BODY.w });
  function portalAmount(a: Shot, b: Shot, t: number) {
    if (a.portal === b.portal) return a.portal;
    if (motion.reduce) return t < 0.5 ? a.portal : b.portal;
    return b.portal > a.portal ? smooth(0.1, 0.78, t) : 1 - smooth(0.04, 0.42, t);
  }
  function startBlink(swap: ExprName | null) {
    blink = { active: true, t0: time, swap };
  }
  function rectFor(shot: Shot): Rect {
    if (mode === 'hero') return rects.hero!;
    if (mode === 'cta') return rects.cta!;
    return story!.st.geo![shot.rect || 'stage'];
  }
  function ctaProgress() {
    const r = slots.cta!.getBoundingClientRect();
    const vis = (innerHeight - r.top) / Math.max(1, Math.min(r.height, innerHeight));
    return smooth(0.25, 0.75, vis);
  }
  const updatePortal = (p: number) => portal?.update(p, { camera, lensWorld, headMesh, W, H, time: window.__buddyCalm ? 0 : time });

  function frame(dt: number) {
    time += dt;
    if (!ready || !mode) return;
    const reduce = motion.reduce;
    // test hook: calm mode freezes ambient motion (breathing, blinks, drift, auto-waves) for reproducible screenshots
    const calm = !!window.__buddyCalm;
    const at = calm ? 0 : time;
    const bones = rig.bones;
    let a: Shot, b: Shot, e: number, t = 0, revealSeg = false, r = 0, k = 0, portalP = 0, docked = false, idx = -1;
    if (mode === 'story' && story) {
      const sp = story.st.sp;
      let i = 0;
      while (i < STORY.length - 2 && sp > STORY[i + 1].y) i++;
      idx = i;
      const A = STORY[i], B = STORY[i + 1];
      t = clamp((sp - A.y) / Math.max(1e-6, B.y - A.y));
      a = A.shot;
      b = B.shot;
      revealSeg = i === I_CAREHOLD;
      docked = i >= I_DOCK;
      r = revealSeg ? story.st.r : docked ? 1 : 0;
      k = clamp((r - 0.22) / 0.64);
      e = reduce ? (t < 0.5 ? 0 : 1) : smooth(0.16, 0.84, t);
      if (revealSeg && !reduce) e = smooth(0, 0.5, t);
      portalP = portalAmount(a, b, t);
    } else if (mode === 'hero') {
      a = b = HERO;
      e = 0;
    } else {
      a = SHOTS.ctaIn;
      b = SHOTS.cta;
      e = reduce ? 1 : ctaProgress();
    }
    const poseW = revealSeg ? (reduce ? (r < 0.5 ? 0 : 1) : smooth(0.08, 0.45, k)) : e;
    let drop = 0, peekLook = -1;
    if (introWaiting && mode === 'hero') {
      introWaiting = false;
      introStart = time;
      nextAutoWave = time + INTRO_LEN + 0.6;
    }
    if (introStart >= 0 && mode === 'hero') {
      const u = time - introStart;
      if (u >= INTRO_LEN) {
        introStart = -1;
        triggerWave(2.1);
        onIntroDone?.();
      } else if (u < INTRO.peek) drop = lerp(1.18, 0.64, easeOutCubic(u / INTRO.peek));
      else if (u < INTRO.peek + INTRO.look) {
        peekLook = (u - INTRO.peek) / INTRO.look;
        drop = 0.64 - Math.sin(Math.PI * peekLook) * 0.02;
        if (!introBlinked && peekLook > 0.55) {
          introBlinked = true;
          startBlink(null);
        }
      } else drop = lerp(0.64, 0, easeOutBack((u - INTRO.peek - INTRO.look) / INTRO.rise));
    }

    /* body */
    applyPose(rig, a.pose, b.pose, poseW);
    const hk = (time - hopStart) / 0.5;
    if (hk >= 0 && hk < 1) bones.Root.position.y += Math.sin(Math.PI * hk) * 0.07;
    bones.Root.getWorldQuaternion(rootQ);
    rootQInv.copy(rootQ).invert();
    up.set(0, 1, 0).applyQuaternion(rootQ);
    fwd.set(0, 0, 1).applyQuaternion(rootQ);
    right.set(1, 0, 0).applyQuaternion(rootQ);
    if (!reduce) rotateWorld(bones.Chest, right, Math.sin(at * 1.7) * 0.014);

    /* tablet in the left hand */
    model.updateMatrixWorld(true);
    const flip = lerp(a.flip ?? 0, b.flip ?? 0, revealSeg ? 0 : e);
    const theta = Math.PI * (revealSeg ? 1 + (reduce ? (r < 0.5 ? 0 : 1) : easeInOut(smooth(0, 0.28, r))) : flip);
    qFlip.setFromAxisAngle(vA.set(0, 1, 0), theta);
    mLocal.compose(TAB.center, qFlip, tabScl.set(1, 1, 1));
    mTmp.multiplyMatrices(socketL.matrixWorld, mLocal);
    mTmp.decompose(tabPosA, tabQA, tabScl);

    /* head: follows the pointer, or looks at the tablet while holding it */
    const lookTab = revealSeg ? (r < 0.88 ? 1 : 0) : lerp(a.lookTab || 0, b.lookTab || 0, e);
    const track = Math.max(lerp(a.track, b.track, e), lookTab);
    bones.Head.getWorldPosition(headPos);
    const mouse = pointer && pointer.type === 'mouse';
    if (mouse) canvasRect = canvas.getBoundingClientRect();
    if (lookTab > 0.5) lookP.copy(tablet.root.position);
    else if (mouse && pointer) {
      ndc.set(((pointer.x - canvasRect.left) / W) * 2 - 1, -((pointer.y - canvasRect.top) / H) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      lookP.copy(raycaster.ray.origin).addScaledVector(raycaster.ray.direction, camera.position.distanceTo(headPos));
    } else lookP.copy(camera.position);
    vA.subVectors(lookP, headPos).applyQuaternion(rootQInv);
    let yawT = clamp(Math.atan2(vA.x, vA.z), -0.6, 0.6);
    let pitchT = clamp(Math.atan2(vA.y, Math.hypot(vA.x, vA.z)), -0.45, 0.3);
    if (peekLook >= 0) {
      // peeking over the edge: a look to one side, then the other, chin up
      yawT = Math.sin(peekLook * Math.PI * 2) * 0.5;
      pitchT = 0.2;
    } else if (!reduce && !calm && lookTab < 0.5) {
      yawT += Math.sin(time * 0.37) * 0.05;
      pitchT += Math.sin(time * 0.29 + 1) * 0.03;
    }
    const lookW = peekLook >= 0 ? 1 : track;
    look.yaw = lerp(look.yaw, yawT * lookW, 1 - Math.exp(-dt * 6));
    look.pitch = lerp(look.pitch, pitchT * lookW, 1 - Math.exp(-dt * 6));
    rotateWorld(bones.Neck, up, look.yaw * 0.35);
    rotateWorld(bones.Head, up, look.yaw * 0.65);
    rotateWorld(bones.Head, right, -look.pitch);
    rotateWorld(bones.Head, fwd, lerp(a.tilt, b.tilt, e));

    /* waving */
    const isWave = (s: Shot) => s.pose === 'Wave' || s.pose === 'Hello';
    const waveW = (isWave(a) ? 1 - poseW : 0) + (isWave(b) ? poseW : 0);
    currentWaveW = waveW;
    if (waveW > 0.001 && !reduce) {
      if (!calm && time > nextAutoWave && waveW > 0.9 && time > waveEnd + 1) {
        triggerWave(2.3);
        nextAutoWave = time + 8 + Math.random() * 4;
      }
      const env = smooth(waveStart, waveStart + 0.25, time) * (1 - smooth(waveEnd - 0.35, waveEnd, time));
      const ph = (time - waveStart) * Math.PI * 2 * 1.7;
      rotateWorld(bones.Forearm_R, fwd, (Math.sin(ph) * 0.36 * env + Math.sin(at * 1.3) * 0.045) * waveW);
      rotateWorld(bones.Hand_R, fwd, Math.sin(ph - 0.8) * 0.2 * env * waveW);
    }
    model.updateMatrixWorld(true);
    lensWorld.copy(LENS_LOCAL);
    headMesh.localToWorld(lensWorld);

    /* hands, heart, face */
    const poseNow = poseW < 0.5 ? a.pose : b.pose;
    const vis = rig.visMap[poseNow] || [];
    for (const n in hands) hands[n].visible = vis.includes(n);
    if (revealSeg && k > 0.06) {
      if (hands.Hand_Grip_L) hands.Hand_Grip_L.visible = false;
      if (hands.Hand_Relaxed_L) hands.Hand_Relaxed_L.visible = true;
    }
    for (const n in propState) {
      const s0 = propState[n];
      s0.target = vis.includes(n) ? 1 : 0;
      const rate = dt / 0.42;
      s0.p = reduce ? s0.target : s0.target ? Math.min(1, s0.p + rate) : Math.max(0, s0.p - rate * 1.7);
      let s = s0.target ? easeOutBack(s0.p) : s0.p * s0.p;
      if (n === 'Prop_Heart' && !reduce) s *= 1 + heartbeat(at) * 0.07;
      s0.obj.scale.setScalar(Math.max(s, 1e-4));
      s0.obj.visible = s > 0.002;
    }
    let want: ExprName = poseW < 0.5 ? a.expr : b.expr;
    if (revealSeg && r > 0.9 && !dockWinked) {
      winkUntil = time + 1.1;
      dockWinked = true;
      triggerWave(1.6);
    }
    if (mode === 'story' && idx < I_CAREHOLD) dockWinked = false;
    if (time < winkUntil) want = 'Wink';
    if (reduce) {
      exprShown = want;
      blink.active = false;
    } else {
      if (want !== exprShown && !blink.active) startBlink(want);
      if (!calm && !blink.active && time > nextBlink) {
        startBlink(null);
        nextBlink = time + 2.6 + Math.random() * 3.2;
      }
    }
    let squash = 0;
    if (blink.active) {
      const bk = (time - blink.t0) / 0.2;
      if (bk >= 0.5 && blink.swap) {
        exprShown = blink.swap;
        blink.swap = null;
      }
      if (bk >= 1) blink.active = false;
      else squash = Math.sin(Math.PI * clamp(bk, 0, 1));
    }
    for (const n in exprs) {
      const o = exprs[n];
      o.visible = n === exprShown;
      const beat = n === 'Caring' && !reduce ? 1 + heartbeat(at) * 0.1 : 1;
      o.scale.set(beat, (1 - 0.9 * squash) * beat, 1);
    }
    exprGlow.material.color.copy(exprShown === 'Caring' ? CORAL : BLUE);
    exprGlow.material.opacity = 0.5 * (1 - 0.7 * squash);
    const ear = lerp(a.ear, b.ear, e);
    const voice = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(at * 5.3) * Math.sin(at * 2.1 + 1.2);
    if (earMat) earMat.emissiveIntensity = 1 + ear * (0.35 + 0.9 * voice);
    earGlowMat.opacity = 0.42 + ear * (0.25 + 0.3 * voice);
    rings.forEach((ring, j) => {
      const ph = (at * 0.55 + j / 3) % 1;
      ring.scale.setScalar(1 + ph * 1.6);
      ring.material.opacity = reduce ? 0 : ear * (1 - ph) * smooth(0, 0.12, ph) * 0.85;
      ring.visible = ring.material.opacity > 0.01;
    });

    /* camera: fit the subject into its stage box inside this studio */
    const rect = lerpRect(rectFor(a), rectFor(b), e);
    const fa = fitOf(a), fb = fitOf(b);
    target.lerpVectors(fa.c, fb.c, e);
    const fitH = Math.exp(lerp(Math.log(fa.h), Math.log(fb.h), e));
    const fitW = Math.exp(lerp(Math.log(fa.w), Math.log(fb.w), e));
    const ppu = Math.min(rect.h / fitH, rect.w / fitW);
    const dist = H / (2 * TAN_HALF * ppu);
    const az = lerp(a.az, b.az, e), el = lerp(a.el, b.el, e);
    camera.position.set(target.x + Math.sin(az) * Math.cos(el) * dist, target.y + Math.sin(el) * dist, target.z + Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(target);
    const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2 + drop * ppu * fitH;
    camera.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H);
    camera.updateMatrixWorld();
    vA.subVectors(camera.position, target).normalize();
    vB.set(1, 0, 0).applyQuaternion(camera.quaternion);
    vC.set(0, 1, 0).applyQuaternion(camera.quaternion);
    key.position.copy(target).addScaledVector(vB, -2.6).addScaledVector(vC, 3.0).addScaledVector(vA, 3.2);
    key.target.position.copy(target);
    rimA.position.copy(target).addScaledVector(vB, -2.8).addScaledVector(vC, 1.6).addScaledVector(vA, -3.0);
    rimA.target.position.copy(target);
    rimC.position.copy(target).addScaledVector(vB, 2.8).addScaledVector(vC, 1.2).addScaledVector(vA, -2.6);
    rimC.target.position.copy(target);

    updateTablet(a, b, e, revealSeg, r, k, dt, dist, docked);
    if (mode === 'story') updatePortal(portalP);
    else if (portal?.visible) updatePortal(0);
    if (mode !== 'story') placeChips(ppu);

    // hover: a friendly "Say hi" label follows the cursor over him
    const over = !!(mouse && pointer && !pointer.busy && hitBuddy(pointer.x, pointer.y));
    if (over !== hovering) {
      hovering = over;
      chips.hi?.classList.toggle('on', over);
      docEl.classList.toggle('over-buddy', over);
    }
    if (over && chips.hi && pointer) chips.hi.style.transform = `translate(${pointer.x + 16}px, ${pointer.y + 14}px)`;

    R.render(scene, camera);
    if (!firstFrame) {
      firstFrame = true;
      onFirstFrame?.();
    }
  }

  function placeChips(ppu: number) {
    const set = mode === 'hero' ? chips.hero : chips.cta;
    // rings behind his head, centred on the projected lens (set on the card so the backdrop's rings inherit it)
    const slot = slots[mode!]!;
    const card = slot.parentElement ?? slot;
    vA.copy(lensWorld).project(camera);
    card.style.setProperty('--hx', (((vA.x + 1) / 2) * W).toFixed(1) + 'px');
    card.style.setProperty('--hy', (((1 - vA.y) / 2) * H).toFixed(1) + 'px');
    card.style.setProperty('--hs', (ppu / 300).toFixed(3));
    if (!set) return;
    const bodyX = ((vA.x + 1) / 2) * W;
    const av = mode === 'hero' ? rects.avoidHero : null;
    for (const c of set) {
      if (!c.el.offsetParent) continue;
      vB.set(1, 0, 0).applyQuaternion(camera.quaternion);
      vC.set(0, 1, 0).applyQuaternion(camera.quaternion);
      vA.set(c.at[0], c.at[1], c.at[2]).addScaledVector(vB, c.off[0]).addScaledVector(vC, c.off[1]).project(camera);
      let x = ((vA.x + 1) / 2) * W, y = ((1 - vA.y) / 2) * H;
      const w = c.el.offsetWidth, h = c.el.offsetHeight;
      if (c.align === 'right') x -= w;
      y -= c.valign === 'bottom' ? h : h / 2;
      x = clamp(x, 12, W - w - 12);
      y = clamp(y, 12, H - h - 12);
      let hide = false;
      // never sit on top of the headline column
      if (av && x < av.x + av.w + 20 && y + h > av.y - 8 && y < av.y + av.h + 8) {
        x = av.x + av.w + 20;
        if (c.align === 'right' ? x + w > bodyX - 60 : x + w > W - 12) hide = true;
      }
      c.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      if (hide !== !!c.hidden) {
        c.hidden = hide;
        c.el.style.opacity = hide ? '0' : '';
      }
    }
  }

  function updateTablet(a: Shot, b: Shot, e: number, revealSeg: boolean, r: number, k: number, dt: number, dist: number, docked: boolean) {
    const reduce = motion.reduce;
    const want = revealSeg || docked ? 1 : lerp(a.tablet ?? 0, b.tablet ?? 0, e) > 0.5 ? 1 : 0;
    tablet.presence = reduce ? want : clamp(tablet.presence + (want ? 1 : -1.7) * (dt / 0.42), 0, 1);
    if ((revealSeg && k > 0) || docked) tablet.presence = 1;
    const pres = want ? easeOutBack(tablet.presence) : tablet.presence * tablet.presence;
    const handoff = mode === 'story' && story ? story.st.handoff : 0;
    const showTab = pres > 0.002 && handoff < 0.999;
    tablet.root.visible = showTab;
    if (!showTab) return;
    const compact = story?.st.compact ?? false;
    const u = tablet.screen.material.uniforms;
    u.uMix.value = compact ? 0 : smooth(0.35, 0.62, k);
    if (!u.uMapA.value && TEX.compact) u.uMapA.value = TEX.compact;
    if (TEX.desk && u.uMapB.value !== TEX.desk) u.uMapB.value = TEX.desk;

    if (k <= 0 || mode !== 'story' || !story) {
      tablet.root.position.copy(tabPosA);
      tablet.root.quaternion.copy(tabQA);
      tablet.root.scale.setScalar(Math.max(pres, 1e-4));
      setTabletDims(tablet, TAB.w, TAB.h, TAB.d, TAB.r, TAB.bz);
      return;
    }
    // Fly to the device box and stretch into it; the screen plane lands at depth dT so its
    // projection matches the HTML device exactly, then the HTML takes over.
    const geo = story.st.geo!, dr = geo.device;
    const dT = dist * 0.55;
    const wpp = (2 * dT * TAN_HALF) / H;
    const kk = easeInOut(k);
    const wT = dr.w * wpp, hT = dr.h * wpp;
    const depth = lerp(TAB.d, Math.max(TAB.d, wT * 0.018), kk);
    const front = depth / 2 + 0.0012;
    ndc.set(((dr.x + dr.w / 2) / W) * 2 - 1, -((dr.y + dr.h / 2) / H) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const camFwd = vA.set(0, 0, -1).applyQuaternion(camera.quaternion);
    const along = raycaster.ray.direction.dot(camFwd);
    tabPosT.copy(raycaster.ray.origin).addScaledVector(raycaster.ray.direction, dT / along).addScaledVector(camFwd, front);
    tablet.root.position.lerpVectors(tabPosA, tabPosT, kk);
    vB.set(0, 1, 0).applyQuaternion(camera.quaternion);
    tablet.root.position.addScaledVector(vB, Math.sin(Math.PI * k) * 0.16);
    tablet.root.quaternion.slerpQuaternions(tabQA, camera.quaternion, kk);
    tablet.root.scale.setScalar(1);
    const bump = reduce ? 0 : Math.sin(Math.PI * smooth(0.7, 1, k));
    const w = lerp(TAB.w, wT, kk) * (1 + 0.07 * bump);
    const h = lerp(TAB.h, hT, kk) * (1 - 0.05 * bump);
    setTabletDims(tablet, Math.max(w, 0.05), Math.max(h, 0.05), depth, lerp(TAB.r, geo.rad * wpp, kk), lerp(TAB.bz, geo.bz * wpp, kk));
  }

  /* ================================================================ still image hook (used to render the poster) */
  function still(w: number, h: number, extra = 0) {
    const fullH = h + extra;
    W = w;
    H = fullH;
    R.setPixelRatio(1);
    R.setSize(w, fullH, false);
    camera.aspect = w / fullH;
    applyPose(rig, 'Hello', 'Hello', 1);
    for (const n in hands) hands[n].visible = rig.visMap.Hello.includes(n);
    for (const n in propState) propState[n].obj.visible = false;
    for (const n in exprs) {
      exprs[n].visible = n === 'Happy';
      exprs[n].scale.set(1, 1, 1);
    }
    rings.forEach((x) => {
      x.visible = false;
    });
    model.updateMatrixWorld(true);
    qFlip.identity();
    mLocal.compose(TAB.center, qFlip, tabScl.set(1, 1, 1));
    mTmp.multiplyMatrices(socketL.matrixWorld, mLocal);
    mTmp.decompose(tablet.root.position, tablet.root.quaternion, tablet.root.scale);
    setTabletDims(tablet, TAB.w, TAB.h, TAB.d, TAB.r, TAB.bz);
    tablet.screen.material.uniforms.uMix.value = 0;
    tablet.root.visible = true;
    const s = SHOTS.hero, ppu = h / BODY.h, dist = fullH / (2 * TAN_HALF * ppu);
    camera.position.set(Math.sin(s.az) * Math.cos(s.el) * dist, BODY_C.y + Math.sin(s.el) * dist, Math.cos(s.az) * Math.cos(s.el) * dist);
    camera.lookAt(BODY_C);
    camera.setViewOffset(w, fullH, 0, fullH / 2 - h / 2, w, fullH);
    camera.updateMatrixWorld();
    vA.subVectors(camera.position, BODY_C).normalize();
    vB.set(1, 0, 0).applyQuaternion(camera.quaternion);
    vC.set(0, 1, 0).applyQuaternion(camera.quaternion);
    key.position.copy(BODY_C).addScaledVector(vB, -2.6).addScaledVector(vC, 3.0).addScaledVector(vA, 3.2);
    key.target.position.copy(BODY_C);
    rimA.position.copy(BODY_C).addScaledVector(vB, -2.8).addScaledVector(vC, 1.6).addScaledVector(vA, -3.0);
    rimA.target.position.copy(BODY_C);
    rimC.position.copy(BODY_C).addScaledVector(vB, 2.8).addScaledVector(vC, 1.2).addScaledVector(vA, -2.6);
    rimC.target.position.copy(BODY_C);
    R.render(scene, camera);
    return canvas.toDataURL('image/png');
  }

  /** Where the tablet's screen plane projects right now, in page pixels (landing check). */
  function landing() {
    if (!ready || mode !== 'story' || !tablet.root.visible) return null;
    tablet.root.updateMatrixWorld(true);
    const cr = canvas.getBoundingClientRect();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) {
      vA.set(x, y, 0).applyMatrix4(tablet.screen.matrixWorld).project(camera);
      const px = ((vA.x + 1) / 2) * W, py = ((1 - vA.y) / 2) * H;
      x0 = Math.min(x0, px);
      y0 = Math.min(y0, py);
      x1 = Math.max(x1, px);
      y1 = Math.max(y1, py);
    }
    return { x: cr.left + x0, y: cr.top + y0, w: x1 - x0, h: y1 - y0 };
  }

  /** Glow check: projected centre of the lit lens-glow ring vs. the projected centre of the rim,
      plus the current head yaw. With the glow sitting on the surface, the two stay together as the head turns. */
  function glowCheck() {
    if (!ready || !mode || !lensGlow || !lensRimObj) return null;
    model.updateMatrixWorld(true);
    const pos = lensGlow.geometry.getAttribute('position'), col = lensGlow.geometry.getAttribute('color');
    let gx = 0, gy = 0, n = 0;
    for (let i = 0; i < pos.count; i++) {
      if (col.getW(i) < 0.5) continue;
      vA.fromBufferAttribute(pos, i).applyMatrix4(lensGlow.matrixWorld).project(camera);
      gx += ((vA.x + 1) / 2) * W;
      gy += ((1 - vA.y) / 2) * H;
      n++;
    }
    const box = new THREE.Box3().setFromObject(lensRimObj);
    box.getCenter(vB).project(camera);
    const rx = ((vB.x + 1) / 2) * W, ry = ((1 - vB.y) / 2) * H;
    return { err: Math.hypot(gx / n - rx, gy / n - ry), yaw: look.yaw, pitch: look.pitch, samples: n };
  }

  /* ================================================================ teardown */
  function dispose() {
    if (disposed) return;
    disposed = true;
    ready = false;
    failed = true;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerdown', onPointerDown);
    docEl.removeEventListener('mouseleave', onMouseLeave);
    mqDark.removeEventListener('change', readTheme);
    themeObserver.disconnect();
    canvas.removeEventListener('webglcontextlost', onContextLost);
    draco.dispose();
    if (hovering) {
      chips.hi?.classList.remove('on');
      docEl.classList.remove('over-buddy');
    }
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) geometries.add(m.geometry);
      if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => materials.add(x));
    });
    for (const mat of materials) {
      for (const v of Object.values(mat)) if (v && (v as THREE.Texture).isTexture) textures.add(v as THREE.Texture);
      mat.dispose();
    }
    if (TEX.desk) textures.add(TEX.desk);
    if (TEX.compact) textures.add(TEX.compact);
    textures.forEach((t) => t.dispose());
    geometries.forEach((g) => g.dispose());
    envRT.dispose();
    scene.clear();
    R.dispose();
    R.forceContextLoss();
    canvas.remove();
  }

  return {
    canvas,
    get ready() {
      return ready;
    },
    get firstFrame() {
      return firstFrame;
    },
    get mode() {
      return mode;
    },
    setMode,
    resize,
    frame,
    still,
    posterPlacement,
    landing,
    glowCheck,
    texReady: () => !!(TEX.compact && TEX.compact.image),
    sayHi,
    dispose,
  };
}

/** Class wrapper with the init/dispose lifecycle the runtime uses. */
export class BuddyEngine {
  private api: Buddy | null = null;
  init(options: EngineOptions) {
    this.api = createBuddy(options);
    return this.api;
  }
  get instance() {
    return this.api;
  }
  dispose() {
    this.api?.dispose();
    this.api = null;
  }
}

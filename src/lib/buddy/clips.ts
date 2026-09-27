import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Rig } from './poses';

/* The model's animation clips (the Anim_* actions), sampled by hand every frame and blended over
   the poses, so everything the engine adds on top (head look, tablet, glow) keeps working.
   - Layered: the clip takes the whole body. The bones it keys come from the clip and the rest from
     its base pose (the pose it starts from), crossfaded from whatever he was doing.
   - Additive: the clip's motion relative to its first frame, added to any pose. Breathing plays
     under everything; looking around plays over the tablet-holding poses.
   Hands, props and faces follow a layered clip's anim_visibility steps (a JSON property on Rig). */

export type ClipName =
  | 'Anim_Idle_Breathe'
  | 'Anim_Idle_LookAround'
  | 'Anim_Idle_CheckTablet'
  | 'Anim_Intro_Pop'
  | 'Anim_Wave_Hello'
  | 'Anim_Wave_Small'
  | 'Anim_Hop_Happy'
  | 'Anim_Talk_A'
  | 'Anim_Talk_B'
  | 'Anim_Listen_CupEar'
  | 'Anim_Tablet_Tap'
  | 'Anim_Present'
  | 'Anim_Heart_Offer'
  | 'Anim_Confused';

type Sampler = { evaluate(t: number): ArrayLike<number> };
type Channel = { bone: THREE.Object3D; q?: Sampler; p?: Sampler; q0: THREE.Quaternion; p0: THREE.Vector3 };

type Clip = {
  name: ClipName;
  duration: number;
  loop: boolean;
  /** Where a loop restarts: the listening clip plays its way in once, then loops the rest. */
  loopFrom: number;
  /** The pose its unkeyed bones come from. */
  base: string;
  channels: Record<string, Channel>;
  keysHead: boolean;
  /** [seconds, the hands, props and face shown from then on] */
  vis: [number, string[]][];
};

/** Clip settings written by the exporter (glTF extras). */
type ClipExtras = { loop?: boolean; start_pose?: string; end_pose?: string; loop_from?: number };

function readClips(gltf: GLTF, rig: Rig, holder: THREE.Object3D) {
  let visAll: Record<string, [number, string[]][]> = {};
  try {
    visAll = JSON.parse((holder.userData.anim_visibility as string) || '{}');
  } catch {
    visAll = {};
  }
  const pose = (name?: string) => (name && rig.poses[name] ? name : null);
  const out: Partial<Record<ClipName, Clip>> = {};
  for (const ac of gltf.animations) {
    if (!ac.name.startsWith('Anim_')) continue;
    const ex = ac.userData as ClipExtras;
    const channels: Record<string, Channel> = {};
    for (const tr of ac.tracks) {
      const dot = tr.name.lastIndexOf('.');
      const node = tr.name.slice(0, dot), prop = tr.name.slice(dot + 1);
      const bone = rig.bones[node];
      if (!bone || (prop !== 'quaternion' && prop !== 'position')) continue;
      const ch = channels[node] || (channels[node] = { bone, q0: new THREE.Quaternion(), p0: new THREE.Vector3() });
      // the factory is set per track at runtime (glTF cubic splines bring their own), so it isn't in the typings
      const sampler = (tr as THREE.KeyframeTrack & { createInterpolant(): Sampler }).createInterpolant();
      if (prop === 'quaternion') {
        ch.q = sampler;
        ch.q0.fromArray(tr.values, 0);
      } else {
        ch.p = sampler;
        ch.p0.fromArray(tr.values, 0);
      }
    }
    const name = ac.name as ClipName;
    out[name] = {
      name,
      duration: ac.duration,
      loop: !!ex.loop || ex.loop_from != null,
      loopFrom: ex.loop_from ?? 0,
      // start or end pose; the intro's crouch and the raised tablet start on frames of their own
      base: pose(ex.start_pose) ?? pose(ex.end_pose) ?? (ex.start_pose?.startsWith('HoldTablet') ? 'HoldTablet' : 'Rest'),
      channels,
      keysHead: !!(channels.Head || channels.Neck),
      vis: visAll[name] ?? [],
    };
  }
  return out;
}

type Layer = { clip: Clip; t: number; w: number; fadeIn: number; fadeOut: number; speed: number; rate: number; hold: boolean; out: boolean };
/** speed: playback rate (1 = as authored). */
export type PlayOptions = { fadeIn?: number; fadeOut?: number; hold?: boolean; paused?: boolean; speed?: number };

const _q = new THREE.Quaternion(), _d = new THREE.Quaternion(), _e = new THREE.Quaternion(), _p = new THREE.Vector3();

function advance(L: Layer, dt: number) {
  const c = L.clip;
  L.t += dt * L.rate;
  if (c.loop) {
    if (L.t >= c.duration) L.t = c.loopFrom + ((L.t - c.loopFrom) % Math.max(1e-3, c.duration - c.loopFrom));
  } else if (L.t >= c.duration) L.t = c.duration;
  // a one-shot ends on its base pose, so fading it out as it ends hands over without a jump
  const left = L.rate > 0 ? (c.duration - L.t) / L.rate : Infinity;
  if (!c.loop && !L.hold && !L.out && left <= L.fadeOut) L.out = true;
  L.w = L.out ? Math.max(0, L.w - dt / L.fadeOut) : Math.min(1, L.w + dt / L.fadeIn);
}

/** The whole body toward the clip's frame: keyed bones from the clip, the rest from its base pose. */
function layered(rig: Rig, L: Layer) {
  if (L.w <= 0) return;
  const base = rig.poses[L.clip.base] ?? rig.poses.Rest;
  for (const n of rig.boneNames) {
    const bone = rig.bones[n], ch = L.clip.channels[n], b = base[n];
    if (ch?.q) _q.fromArray(ch.q.evaluate(L.t)).normalize();
    else _q.copy(b.q);
    bone.quaternion.slerp(_q, L.w);
    if (ch?.p) _p.fromArray(ch.p.evaluate(L.t));
    else _p.copy(b.p);
    bone.position.lerp(_p, L.w);
  }
}

/** The clip's motion since its first frame, added in each bone's own frame. */
function additive(L: Layer) {
  if (L.w <= 0) return;
  for (const n in L.clip.channels) {
    const ch = L.clip.channels[n];
    if (ch.q) {
      _d.copy(ch.q0).invert().multiply(_q.fromArray(ch.q.evaluate(L.t)).normalize());
      ch.bone.quaternion.multiply(L.w < 1 ? _e.identity().slerp(_d, L.w) : _d);
    }
    if (ch.p) ch.bone.position.add(_p.fromArray(ch.p.evaluate(L.t)).sub(ch.p0).multiplyScalar(L.w));
  }
}

export type ClipPlayer = NonNullable<ReturnType<typeof createClipPlayer>>;

/** One layered clip at a time (crossfading from the last one), one additive one-shot, and breathing. */
export function createClipPlayer(gltf: GLTF, rig: Rig, holder: THREE.Object3D) {
  const clips = readClips(gltf, rig, holder);
  if (!Object.keys(clips).length) return null;
  let main: Layer | null = null, under: Layer | null = null, extra: Layer | null = null, lock = 0;
  const layer = (clip: Clip, o: PlayOptions): Layer => {
    const fadeIn = o.fadeIn ?? 0.25, speed = o.speed ?? 1;
    return { clip, t: 0, w: fadeIn > 0 ? 0 : 1, fadeIn, fadeOut: o.fadeOut ?? fadeIn, speed, rate: o.paused ? 0 : speed, hold: !!o.hold, out: false };
  };
  const breath: Layer | null = clips.Anim_Idle_Breathe ? layer(clips.Anim_Idle_Breathe, { fadeIn: 1 }) : null;

  return {
    has: (name: ClipName) => !!clips[name],
    duration: (name: ClipName) => clips[name]?.duration ?? 0,
    /** The pose a clip starts from (so the engine can pick a matching crossfade). */
    base: (name: ClipName) => clips[name]?.base ?? 'Rest',
    /** Plays a clip over the whole body; the one it replaces stays under it until it is fully in. */
    play(name: ClipName, o: PlayOptions = {}) {
      const clip = clips[name];
      if (!clip) return false;
      if (main && main.w > 0) under = main;
      main = layer(clip, o);
      return true;
    },
    /** Fades the playing clip out to the pose underneath. */
    stop(fade = 0.3) {
      for (const L of [main, under]) {
        if (!L || L.out) continue;
        L.out = true;
        L.fadeOut = fade;
      }
    },
    /** Adds a clip's motion over the current pose, once. */
    add(name: ClipName, fade = 0.4, speed = 1) {
      const clip = clips[name];
      if (clip) extra = layer(clip, { fadeIn: fade, speed });
    },
    /** Starts a clip that was waiting on its first frame. */
    resume() {
      if (main) main.rate = main.speed;
    },
    /** The layered clip playing (not fading out), if any. */
    current: () => (main && !main.out ? main.clip.name : null),
    busy: () => !!(main || extra),
    extraOn: () => !!extra,
    update(dt: number) {
      for (const L of [under, main, extra, breath]) if (L) advance(L, dt);
      if (main?.out && main.w <= 0) main = null;
      if (under && (!main || main.w >= 1 || under.w <= 0)) under = null;
      if (extra?.out && extra.w <= 0) extra = null;
      // the clips turn the head while they move it; a held last frame gives it back to the engine
      const target = Math.max(
        main?.clip.keysHead && !(main.hold && main.t >= main.clip.duration) ? main.w : 0,
        under?.clip.keysHead ? under.w : 0,
        extra?.clip.keysHead ? extra.w : 0,
      );
      lock += (target - lock) * Math.min(1, dt * 8);
    },
    /** Applies the clips over the pose already on the bones. */
    apply() {
      if (under) layered(rig, under);
      if (main) layered(rig, main);
      if (extra) additive(extra);
      if (breath) additive(breath);
    },
    /** The hands, props and face the playing clip shows now, or null for the pose's own. */
    visible(): string[] | null {
      const L = main && main.w >= 0.5 ? main : under && under.w >= 0.5 ? under : null;
      if (!L || !L.clip.vis.length) return null;
      let v = L.clip.vis[0][1];
      for (const [s, list] of L.clip.vis) if (L.t >= s) v = list;
      return v;
    },
    /** 0 to 1: how much the clips are turning his head (the engine's head look yields that much). */
    headLock: () => lock,
    /** Puts the body on one frame of a clip (for measuring). */
    pose(name: ClipName, t: number) {
      const clip = clips[name];
      if (!clip) return;
      const L = layer(clip, { fadeIn: 0 });
      L.t = t;
      layered(rig, L);
    },
    reset() {
      main = under = extra = null;
      lock = 0;
    },
  };
}

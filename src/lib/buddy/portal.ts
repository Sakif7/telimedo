import * as THREE from 'three';
import { lerp, motion, smooth } from '@/lib/motion';
import type { Story } from '@/lib/story/controller';
import { GLASS_R } from './shots';

/* The lens that opens into the video call: a clip-path circle on the call,
   centred on the projected lens and growing from the glass radius to the
   farthest corner of the call. */
export function createPortal(story: Story) {
  let visible = false, timerBase = -1, lastSecs = -1;
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), headQ = new THREE.Quaternion();

  function update(p: number, ctx: { camera: THREE.Camera; lensWorld: THREE.Vector3; headMesh: THREE.Object3D; W: number; H: number; time: number }) {
    const wrap = story.callWrap, call = story.call;
    if (p <= 0.001) {
      if (visible) {
        wrap.style.visibility = 'hidden';
        visible = false;
        timerBase = -1;
      }
      return;
    }
    if (!visible) {
      wrap.style.visibility = 'visible';
      visible = true;
    }
    const { camera, lensWorld, headMesh, W, H, time } = ctx;
    const geo = story.st.geo!, S = story.st.studioRect;
    const ox = S.x + geo.call.x, oy = S.y + geo.call.y;
    vA.copy(lensWorld).project(camera);
    const cx = ((vA.x + 1) / 2) * W - ox, cy = ((1 - vA.y) / 2) * H - oy;
    headMesh.getWorldQuaternion(headQ);
    vB.set(GLASS_R, 0, 0).applyQuaternion(headQ).add(lensWorld).project(camera);
    const rr = Math.hypot(((vB.x + 1) / 2) * W - ox - cx, ((1 - vB.y) / 2) * H - oy - cy);
    const cw = geo.call.w, ch = geo.call.h;
    const maxR = Math.max(Math.hypot(cx, cy), Math.hypot(cw - cx, cy), Math.hypot(cx, ch - cy), Math.hypot(cw - cx, ch - cy)) + 4;
    const fade = smooth(0, 0.2, p), grow = motion.reduce ? 1 : smooth(0.2, 1, p);
    wrap.style.opacity = fade.toFixed(3);
    wrap.style.clipPath = `circle(${lerp(rr * 0.98, maxR, grow).toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
    call.style.transform = `scale(${lerp(0.92, 1, grow).toFixed(4)})`;
    if (p > 0.6) {
      if (timerBase < 0) timerBase = time;
      const secs = 252 + Math.floor(time - timerBase);
      if (secs !== lastSecs && story.timer) {
        lastSecs = secs;
        story.timer.textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
      }
    }
  }

  return {
    update,
    get visible() {
      return visible;
    },
  };
}

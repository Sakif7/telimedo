import type { ShotName } from '@/lib/buddy/shots';
import type { StoryRefs } from '@/lib/story/controller';

/* Elements the React components hand to the imperative runtime. Components
   register them after mount; the runtime reads them once when it starts. */

export type StudioRefs = {
  card: HTMLElement;
  slot: HTMLElement;
  stage: HTMLElement;
  poster: HTMLElement | null;
  /** Hero only: the headline column the floating chips must keep clear of. */
  avoid?: HTMLElement | null;
  /** Hero only: chips anchored to 3D points (data-at, data-off, data-align). */
  chips?: HTMLElement[];
  /** Hero only: the buddy's shot in this studio (the home hero uses 'hero'; other pages pick a pose). */
  shot?: ShotName;
};

export type ManifestoRefs = { text: HTMLElement; words: HTMLElement[] };

export type Registry = {
  hero?: StudioRefs;
  cta?: StudioRefs;
  story?: StoryRefs;
  manifesto?: ManifestoRefs;
  sayHi?: HTMLElement;
};

export type BrandSvgs = { wordmark: string; mark: string };

export type BuddyHooks = {
  ready: () => boolean;
  still: (w: number, h: number, extra?: number) => string | undefined;
  mode: () => string | null | undefined;
  storyY: (sp: number) => number;
  KF: Record<string, number>;
  no3d: () => boolean;
  /** Projected tablet screen vs. the HTML device screen, in page pixels (landing check). */
  landing: () => { tablet: DOMRectLike; device: DOMRectLike } | null;
  /** Lens glow vs. rim centre (px) and head yaw (rad): the glow must stay on the rim as the head turns. */
  glowCheck: () => { err: number; yaw: number; pitch: number; samples: number } | null;
  canvases: () => number;
};
export type DOMRectLike = { x: number; y: number; w: number; h: number };

declare global {
  interface Window {
    __buddy?: BuddyHooks;
    /** Tests raise the per-frame dt cap because software WebGL runs at 2 to 3 fps. */
    __buddyDtCap?: number;
    /** Tests freeze ambient motion (breathing, blinks, idle drift, auto-waves) for reproducible screenshots. */
    __buddyCalm?: boolean;
    /** Tests can wait longer before the still replaces a slow-starting 3D (software WebGL is slow), to see the intro. */
    __buddyLateMs?: number;
  }
}

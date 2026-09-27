/* Signals between the lazily loaded runtime and components. Kept apart from
   runtime.ts so importing them doesn't pull the runtime into a component's bundle. */

/** Fired on window (and html gets .buddy-in) once the buddy is in place in his first studio. */
export const BUDDY_IN_EVENT = 'telimedo:buddy-in';

/** Fired on window when the speech bubble starts typing a line; the buddy gestures as he talks. */
export const BUDDY_TALK_EVENT = 'telimedo:buddy-talk';

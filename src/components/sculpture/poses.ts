/**
 * Where the sculpture sits behind each section, and which frame the desktop sequence shows.
 * Pure data and maths: no DOM, so it is unit tested (poses.test.ts).
 *
 * A pose moves the whole layer with `transform` and `opacity` only (DESIGN.md 9):
 *   x, y     shift, in vw and lvh
 *   scale    size, 1 = as laid out by the CSS
 *   opacity  brightness. 1 only in the hero; DESIGN.md 2 caps the rest so text stays readable.
 */
export type Pose = { readonly x: number; readonly y: number; readonly scale: number; readonly opacity: number };

/** One pose per entry of POSE_ORDER (src/lib/scroll-store.ts): hero, services, work, demo, process, faq, contact. */
export const DESKTOP_POSES: readonly Pose[] = [
  { x: 2, y: 0, scale: 0.74, opacity: 1 }, // right of centre, whole, on the frame's own dark left side
  { x: 2, y: 16, scale: 1.1, opacity: 0.26 }, // low, behind the services panel, clear of the heading
  { x: 14, y: 10, scale: 1.3, opacity: 0.2 }, // large and faint behind the work cards
  { x: 10, y: 8, scale: 0.95, opacity: 0.22 }, // behind the demo frame, clear of the text on the left
  { x: 16, y: 24, scale: 1.1, opacity: 0.16 }, // bottom right, below the process steps
  { x: 12, y: 4, scale: 1.05, opacity: 0.24 }, // behind the FAQ panel
  { x: 6, y: 8, scale: 1.3, opacity: 0.2 }, // behind the enquiry form
];

/** Phones and tablets: centred and large; scroll only breathes it up, down and in size. */
export const PHONE_POSES: readonly Pose[] = [
  { x: 0, y: 22, scale: 1, opacity: 1 }, // under the hero text
  { x: 0, y: -6, scale: 1.25, opacity: 0.22 },
  { x: 0, y: 4, scale: 1.4, opacity: 0.2 },
  { x: 0, y: -2, scale: 1.2, opacity: 0.22 },
  { x: 0, y: 18, scale: 1.3, opacity: 0.16 }, // low and at its dimmest: the steps are bare text
  { x: 0, y: -4, scale: 1.25, opacity: 0.22 },
  { x: 0, y: 2, scale: 1.45, opacity: 0.2 },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** The pose at a float index into `poses` (scrollState.poseIndex), eased between neighbours. */
export function poseAt(index: number, poses: readonly Pose[]): Pose {
  const i = clamp(Math.floor(index), 0, poses.length - 1);
  const next = Math.min(i + 1, poses.length - 1);
  const linear = clamp(index - i, 0, 1);
  const t = linear * linear * (3 - 2 * linear); // smoothstep: settles into each section
  const a = poses[i];
  const b = poses[next];
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    scale: lerp(a.scale, b.scale, t),
    opacity: lerp(a.opacity, b.opacity, t),
  };
}

export const FRAME_COUNT = 190;
/** Idle drift: the rings sway this many frames, there and back, once per period. */
const DRIFT_FRAMES = 22;
const DRIFT_PERIOD_S = 16;

/**
 * The frame to show (a float; the fraction is the cross-fade to the next frame).
 * Scroll owns most of the sequence: down the page turns the rings forward, up turns them back.
 * The drift starts at 0 with no speed, so the first frame equals the poster.
 */
export function frameAt(progress: number, seconds: number): number {
  const drift = (DRIFT_FRAMES / 2) * (1 - Math.cos((2 * Math.PI * seconds) / DRIFT_PERIOD_S));
  return clamp(progress, 0, 1) * (FRAME_COUNT - 1 - DRIFT_FRAMES) + drift;
}

/** Frame-rate independent easing towards a target (critically damped feel, no overshoot). */
export function damp(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}

/** Load order for the frames: a coarse pass first, so scrubbing works after a dozen images. */
export function loadOrder(count: number = FRAME_COUNT): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  for (let step = 16; step >= 1; step /= 2) {
    for (let i = 0; i < count; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  return order;
}

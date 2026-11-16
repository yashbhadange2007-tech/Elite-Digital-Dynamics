import { damp } from 'maath/easing';
import { Euler, MathUtils, Quaternion } from 'three';
import { LOGO } from './geometry';
import { POSES, REACH_UP, type Place, type Pose } from './poses';

/**
 * Turns scroll, time and pointer into what the scene shows. No renderer in here: plain numbers and
 * quaternions, so it runs in unit tests.
 *
 * How it stays smooth:
 * - The raw pose index (it can jump by 6 in one frame) is damped into `p` with a speed limit.
 * - Position, size, dim and ring orientations are a pure function of `p`: smoothstep inside each
 *   segment between two poses. So motion always passes through the poses in between, and it stops
 *   and reverses without a jump.
 * - In-plane spin is integrated from the blended spin speed. In the contact pose (spin speed 0) a
 *   pull towards the nearest full turn takes over, so the rings arrive at the logo's exact angles
 *   without a snap and without unwinding.
 * - Idle sway is two bounded sines. The pointer adds a damped tilt of at most MAX_TILT.
 */

/** Seconds for the damped pose index to close most of a gap. */
export const SMOOTH_TIME = 0.35;
/** Speed limit of the damped pose index, poses per second. */
export const MAX_SPEED = 2.5;
/** Longest time step the solver accepts, seconds. */
export const MAX_DT = 0.05;
/** Largest tilt the pointer adds, radians. */
export const MAX_TILT = 0.12;
/** Strength of the pull to the nearest full turn in the contact pose, per second. */
export const SETTLE_RATE = 4;
/** Below this width the phone placements are used: the `lg` breakpoint, where the layouts change. */
const PHONE_MAX = 1024;

export type SolverInput = {
  /** Seconds since the last step. */
  dt: number;
  /** Raw `scrollState.poseIndex`. */
  poseIndex: number;
  /** Pointer position from the viewport centre, -1 to 1 on both axes, or null (touch, no pointer). */
  pointer: { x: number; y: number } | null;
  /** Size of the scene layer, px. */
  viewport: { w: number; h: number };
  /** The logo stage on screen: centre and side length in px, or null when the page has none. */
  stage: { x: number; y: number; size: number } | null;
  /** Jump straight to `poseIndex` (the still frame). */
  snap?: boolean;
};

export type RingState = {
  /** Orientation, spin and sway included. */
  q: Quaternion;
  /** Offset from the core in units of ring A's radius (x right, y up). */
  x: number;
  y: number;
};

export type SolverOutput = {
  /** Damped pose index. */
  p: number;
  /** Centre of the object on screen, px from the top left of the scene layer. */
  x: number;
  y: number;
  /** Ring A's radius, px. */
  r: number;
  dim: number;
  fps: 30 | 60;
  /** Pointer tilt of the whole object, radians about x and y. */
  tiltX: number;
  tiltY: number;
  a: RingState;
  b: RingState;
};

const LAST = POSES.length - 1;
const toQuat = (deg: [number, number, number]) =>
  new Quaternion().setFromEuler(new Euler(...deg.map(MathUtils.degToRad)));
const QUAT_A = POSES.map((pose) => toQuat(pose.tiltA));
const QUAT_B = POSES.map((pose) => toQuat(pose.tiltB));

const { lerp, clamp } = MathUtils;
const euler = new Euler();
const local = new Quaternion();

/** Where a pose puts the object, in px. The contact pose sits on the logo stage when there is one. */
function place(pose: Pose, input: SolverInput): { x: number; y: number; r: number; at: Place } {
  const { w, h } = input.viewport;
  const at = w < PHONE_MAX ? pose.phone : pose.desktop;
  const stage = input.stage;
  if (pose.id === 'contact' && stage) {
    // Off screen the object waits just outside the edge instead of thousands of px away.
    return { x: stage.x, y: clamp(stage.y, -stage.size, h + stage.size), r: stage.size * LOGO.radiusInBox, at };
  }
  const r = at.size * Math.min(w, h);
  const y = at.below === undefined ? at.y * h : Math.max(at.y * h, at.below + REACH_UP * r);
  return { x: at.x * w, y, r, at };
}

export function createSolver(startIndex = 0) {
  const state = { p: clamp(startIndex, 0, LAST), tiltX: 0, tiltY: 0 };
  const phase = [0.9, 2.2]; // spin of A and B, radians; any start works
  let time = 0;
  const out: SolverOutput = {
    p: state.p,
    x: 0,
    y: 0,
    r: 0,
    dim: 0,
    fps: 60,
    tiltX: 0,
    tiltY: 0,
    a: { q: new Quaternion(), x: 0, y: 0 },
    b: { q: new Quaternion(), x: 0, y: 0 },
  };

  const rings = [
    { ring: out.a, quats: QUAT_A, key: 'a' as const },
    { ring: out.b, quats: QUAT_B, key: 'b' as const },
  ];

  function step(input: SolverInput): SolverOutput {
    const dt = clamp(input.dt, 0, MAX_DT);
    const target = clamp(input.poseIndex, 0, LAST);
    if (input.snap) state.p = target;
    else if (dt > 0) damp(state, 'p', target, SMOOTH_TIME, dt, MAX_SPEED, undefined, 1e-5);
    time += dt;

    const i = Math.min(Math.floor(state.p), LAST - 1);
    const f = state.p - i;
    const t = f * f * (3 - 2 * f);
    const from = POSES[i];
    const to = POSES[i + 1];
    // How much of the contact pose is in the blend: 0 until the last segment, 1 at rest on it.
    const logo = i + 1 === LAST ? t : 0;

    const p0 = place(from, input);
    const p1 = place(to, input);
    out.p = state.p;
    out.x = lerp(p0.x, p1.x, t);
    out.y = lerp(p0.y, p1.y, t);
    out.r = lerp(p0.r, p1.r, t);
    out.dim = lerp(from.dim, to.dim, t);
    out.fps = POSES[Math.round(state.p)].fps;

    const sway = lerp(from.sway, to.sway, t);
    rings.forEach(({ ring, quats, key }, k) => {
      const speed = lerp(from.spin[k], to.spin[k], t);
      phase[k] += (speed - logo * SETTLE_RATE * Math.sin(phase[k])) * dt;
      euler.set(sway * Math.sin(0.6 * time + 2 * k), sway * Math.sin(0.43 * time + 1.3 + k), phase[k]);
      ring.q.slerpQuaternions(quats[i], quats[i + 1], t).multiply(local.setFromEuler(euler));
      ring.x = lerp(p0.at[key]?.[0] ?? 0, p1.at[key]?.[0] ?? 0, t);
      ring.y = lerp(p0.at[key]?.[1] ?? 0, p1.at[key]?.[1] ?? 0, t);
    });

    if (dt > 0) {
      damp(state, 'tiltX', clamp(input.pointer?.y ?? 0, -1, 1) * MAX_TILT, 0.4, dt);
      damp(state, 'tiltY', clamp(input.pointer?.x ?? 0, -1, 1) * MAX_TILT, 0.4, dt);
    }
    // The logo holds still: the pointer tilt fades out with the contact pose.
    out.tiltX = state.tiltX * (1 - logo);
    out.tiltY = state.tiltY * (1 - logo);
    return out;
  }

  return { step, out };
}

import { Quaternion, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { POSE_ORDER } from '@/lib/scroll-store';
import { LOGO } from './geometry';
import { POSES } from './poses';
import { createSolver, MAX_SPEED, SETTLE_RATE, type SolverInput } from './solver';

const LAST = POSES.length - 1;
const DEG = 180 / Math.PI;
const smooth = (f: number) => f * f * (3 - 2 * f);
/** Share of the contact pose in the blend at damped index `p`. */
const logoWeight = (p: number) => (p > LAST - 1 ? smooth(p - (LAST - 1)) : 0);

/** A page model: 900px of scroll per pose, the logo stage at the viewport centre when poseIndex is 6. */
function makeInput(viewport: { w: number; h: number }) {
  const size = viewport.w < 1024 ? 168 : 220;
  return (poseIndex: number, dt: number): SolverInput => ({
    dt,
    poseIndex,
    pointer: null,
    viewport,
    stage: { x: viewport.w * 0.3, y: viewport.h / 2 + (LAST - poseIndex) * 900, size },
  });
}

/** Deterministic pseudo-random numbers in [0, 1). */
function random(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

type History = { name: string; target: (time: number) => number };
const HISTORIES: History[] = [
  { name: 'instant jump 0 to 6 and back', target: (t) => (t < 0.5 ? 0 : t < 5 ? 6 : 0) },
  { name: 'jump to 6, back to 0 before arriving, then 6 again', target: (t) => (t < 0.2 ? 0 : t < 1.3 ? 6 : t < 2.1 ? 0 : 6) },
  { name: 'reversals inside one transition', target: (t) => 2.5 + 2.5 * Math.sign(Math.sin(t * 5)) },
  { name: 'fast flick up and down the whole page', target: (t) => 3 + 3 * Math.sin(t * 9) },
  { name: 'reversals around the contact pose', target: (t) => (Math.floor(t / 0.4) % 2 ? 6 : 4.6) },
];

/*
 * The bound. A snap is a change that does not shrink with the time step, so the test bounds RATES:
 * each frame may change a quantity by at most (rate limit) x (that frame's dt).
 *
 * The rate limits follow from how the solver is built. The damped index moves at most MAX_SPEED
 * poses per second, and smoothstep's slope is at most 1.5, so a blended quantity changes at most
 * 1.5 x MAX_SPEED x (largest difference between neighbouring poses) per second. On top of that,
 * rings turn by their spin (at most the fastest pose spin, or the SETTLE_RATE pull in the contact
 * pose) and sway (amplitude x 0.6 rad/s on each of two axes). 5% slack covers rounding.
 * Position and size are measured in px on a 1440 x 900 and a 375 x 812 viewport. The part of the
 * movement that is the page itself scrolling under the attached logo is subtracted first.
 */
const BLEND_RATE = 1.5 * MAX_SPEED;
const maxSpin = Math.max(...POSES.flatMap((pose) => pose.spin.map(Math.abs)));
const maxSway = Math.max(...POSES.map((pose) => pose.sway));
const quat = (deg: [number, number, number]) => {
  const [x, y, z] = deg.map((d) => d / DEG);
  // Same convention as the solver: Euler XYZ.
  const qx = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), x);
  const qy = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), y);
  const qz = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), z);
  return qx.multiply(qy).multiply(qz);
};
const maxTurn = Math.max(
  ...POSES.slice(1).flatMap((pose, i) => [
    quat(POSES[i].tiltA).angleTo(quat(pose.tiltA)),
    quat(POSES[i].tiltB).angleTo(quat(pose.tiltB)),
  ]),
);
const ANGLE_RATE = 1.05 * (BLEND_RATE * maxTurn + Math.max(maxSpin, SETTLE_RATE) + 2 * maxSway * 0.6);

function run(viewport: { w: number; h: number }, history: History, seed: number, seconds: number) {
  const input = makeInput(viewport);
  const solver = createSolver(history.target(0));
  const next = random(seed);
  const frames: { dt: number; p: number; stageY: number; x: number; y: number; r: number; qa: Quaternion; qb: Quaternion }[] = [];
  for (let time = 0; time < seconds; ) {
    const dt = 0.008 + next() * 0.042; // irregular steps, 8 to 50 ms
    time += dt;
    const step = input(history.target(time), dt);
    const out = solver.step(step);
    const stageY = Math.min(Math.max(step.stage!.y, -step.stage!.size), viewport.h + step.stage!.size);
    frames.push({ dt, p: out.p, stageY, x: out.x, y: out.y, r: out.r, qa: out.a.q.clone(), qb: out.b.q.clone() });
  }
  return { frames, solver, input };
}

describe.each([
  { name: 'desktop', viewport: { w: 1440, h: 900 } },
  { name: 'phone', viewport: { w: 375, h: 812 } },
])('solver on $name', ({ viewport }) => {
  const input = makeInput(viewport);
  // Largest distance and size difference between neighbouring poses on this viewport, px.
  const places = POSES.map((_, i) => {
    const out = createSolver(i).step({ ...input(i, 0), snap: true });
    return { x: out.x, y: out.y, r: out.r };
  });
  const maxMove = Math.max(...places.slice(1).map((p, i) => Math.hypot(p.x - places[i].x, p.y - places[i].y)));
  const maxGrow = Math.max(...places.slice(1).map((p, i) => Math.abs(p.r - places[i].r)));
  // The contact pose's place moves with the page; a stage parked off screen can be this far away.
  const stageReach = Math.hypot(viewport.w, viewport.h + 2 * 220);
  const MOVE_RATE = 1.05 * BLEND_RATE * Math.max(maxMove, stageReach);
  const SIZE_RATE = 1.05 * BLEND_RATE * maxGrow;

  it.each(HISTORIES)('no snaps: $name', (history) => {
    const { frames } = run(viewport, history, 7, 12);
    let worstAngle = 0;
    for (let n = 1; n < frames.length; n++) {
      const now = frames[n];
      const before = frames[n - 1];
      const turnA = now.qa.angleTo(before.qa);
      const turnB = now.qb.angleTo(before.qb);
      worstAngle = Math.max(worstAngle, turnA / now.dt, turnB / now.dt);
      expect(turnA).toBeLessThanOrEqual(ANGLE_RATE * now.dt);
      expect(turnB).toBeLessThanOrEqual(ANGLE_RATE * now.dt);
      // Take out the page's own scroll under the attached logo, then bound what is left.
      const pageScroll = logoWeight(now.p) * (now.stageY - before.stageY);
      expect(Math.hypot(now.x - before.x, now.y - before.y - pageScroll)).toBeLessThanOrEqual(MOVE_RATE * now.dt);
      expect(Math.abs(now.r - before.r)).toBeLessThanOrEqual(SIZE_RATE * now.dt);
      // The damped index itself never outruns its speed limit.
      expect(Math.abs(now.p - before.p)).toBeLessThanOrEqual(MAX_SPEED * now.dt * 1.001);
    }
    expect(worstAngle).toBeGreaterThan(0); // the rings did move
  });

  it('passes through the poses in between on an instant jump', () => {
    const { frames } = run(viewport, HISTORIES[0], 3, 4.5);
    for (let whole = 1; whole < LAST; whole++) {
      expect(frames.some((frame) => Math.abs(frame.p - whole) < 0.07)).toBe(true);
    }
  });

  it.each(POSES.map((pose, index) => ({ id: pose.id, index })))('at rest on $id the output is that pose', ({ index }) => {
    const pose = POSES[index];
    const solver = createSolver(0);
    let out = solver.out;
    for (let n = 0; n < 600; n++) out = solver.step(input(index, 1 / 60));
    const at = viewport.w < 1024 ? pose.phone : pose.desktop;
    const stage = input(index, 0).stage!;

    expect(out.p).toBeCloseTo(index, 4);
    expect(out.dim).toBeCloseTo(pose.dim, 4);
    expect(out.fps).toBe(pose.fps);
    if (pose.id === 'contact') {
      expect(out.x).toBeCloseTo(stage.x, 2);
      expect(out.y).toBeCloseTo(stage.y, 2);
      expect(out.r).toBeCloseTo(stage.size * LOGO.radiusInBox, 2);
    } else {
      expect(out.x).toBeCloseTo(at.x * viewport.w, 2);
      expect(out.y).toBeCloseTo(at.y * viewport.h, 2);
      expect(out.r).toBeCloseTo(at.size * Math.min(viewport.w, viewport.h), 2);
    }
    expect(out.a.x).toBeCloseTo(at.a?.[0] ?? 0, 3);
    expect(out.a.y).toBeCloseTo(at.a?.[1] ?? 0, 3);
    expect(out.b.x).toBeCloseTo(at.b?.[0] ?? 0, 3);
    expect(out.b.y).toBeCloseTo(at.b?.[1] ?? 0, 3);
    // Orientation: the pose's tilt, give or take the idle sway (spin turns the ring in its own plane).
    const normal = new Vector3(0, 0, 1);
    const slack = 2 * pose.sway + 1e-3;
    expect(normal.clone().applyQuaternion(out.a.q).angleTo(normal.clone().applyQuaternion(quat(pose.tiltA)))).toBeLessThanOrEqual(slack);
    expect(normal.clone().applyQuaternion(out.b.q).angleTo(normal.clone().applyQuaternion(quat(pose.tiltB)))).toBeLessThanOrEqual(slack);
  });

  it.each(HISTORIES)('logo settle after: $name', (history) => {
    for (const seed of [1, 2, 3, 4]) {
      const { solver, input: page } = run(viewport, history, seed, 9 + seed * 0.37);
      // Come to rest in the contact pose: 8 seconds with the page held on the logo stage.
      let out = solver.out;
      for (let n = 0; n < 480; n++) out = solver.step(page(LAST, 1 / 60));
      const before = [out.a.q.clone(), out.b.q.clone()];
      out = solver.step(page(LAST, 1 / 60));

      const rings = [
        { q: out.a.q, gapAt: LOGO.ringA.gapAt },
        { q: out.b.q, gapAt: LOGO.ringB.gapAt },
      ];
      rings.forEach(({ q, gapAt }, k) => {
        // Faces the viewer: the ring's axis points at the camera.
        const axis = new Vector3(0, 0, 1).applyQuaternion(q);
        expect(axis.angleTo(new Vector3(0, 0, 1)) * DEG).toBeLessThan(0.5);
        // The gap centre, as drawn in the geometry, lands where the logo has it.
        const gap = new Vector3(Math.cos(gapAt / DEG), Math.sin(gapAt / DEG), 0).applyQuaternion(q);
        const onScreen = (Math.atan2(gap.y, gap.x) * DEG + 360) % 360;
        expect(Math.abs(onScreen - gapAt)).toBeLessThan(0.5);
        // Spin speed is 0: nothing turns between two frames.
        expect(q.angleTo(before[k]) * DEG).toBeLessThan(0.001);
      });
      // One plane: neither ring is offset from the core, and the pointer tilt is off.
      expect([out.a.x, out.a.y, out.b.x, out.b.y, out.tiltX, out.tiltY].every((v) => Math.abs(v) < 1e-6)).toBe(true);
    }
  });
});

describe('poses', () => {
  it('are in scroll order and counter-rotate', () => {
    expect(POSES.map((pose) => pose.id)).toEqual([...POSE_ORDER]);
    for (const pose of POSES) expect(pose.spin[0] * pose.spin[1]).toBeLessThanOrEqual(0);
    expect(POSES[LAST].spin).toEqual([0, 0]);
    expect(POSES.find((pose) => pose.id === 'demo')?.fps).toBe(30);
  });
});

describe('pointer', () => {
  it('tilts the object smoothly, by at most 0.12 rad, and not at all without a pointer', () => {
    const viewport = { w: 1440, h: 900 };
    const solver = createSolver(0);
    let previous = 0;
    for (let n = 0; n < 300; n++) {
      const out = solver.step({ dt: 1 / 60, poseIndex: 0, pointer: { x: 1, y: -1 }, viewport, stage: null });
      expect(Math.abs(out.tiltY - previous)).toBeLessThan(0.01);
      previous = out.tiltY;
    }
    expect(solver.out.tiltY).toBeCloseTo(0.12, 2);
    expect(solver.out.tiltX).toBeCloseTo(-0.12, 2);

    const touch = createSolver(0);
    for (let n = 0; n < 60; n++) touch.step({ dt: 1 / 60, poseIndex: 0, pointer: null, viewport, stage: null });
    expect(touch.out.tiltX).toBe(0);
    expect(touch.out.tiltY).toBe(0);
  });
});

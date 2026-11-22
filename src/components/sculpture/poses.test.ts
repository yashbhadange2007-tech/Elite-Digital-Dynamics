import { describe, expect, it } from 'vitest';
import { POSE_ORDER } from '@/lib/scroll-store';
import { DESKTOP_POSES, FRAME_COUNT, PHONE_POSES, damp, frameAt, loadOrder, poseAt } from './poses';

describe('poses', () => {
  it('has one pose per section, full strength only in the hero, dim enough everywhere else', () => {
    for (const [poses, cap] of [[DESKTOP_POSES, 0.3], [PHONE_POSES, 0.25]] as const) {
      expect(poses).toHaveLength(POSE_ORDER.length);
      expect(poses[0].opacity).toBe(1);
      for (const pose of poses.slice(1)) expect(pose.opacity).toBeLessThanOrEqual(cap); // DESIGN.md 2
    }
  });

  it('eases between neighbours and clamps at both ends', () => {
    expect(poseAt(0, DESKTOP_POSES)).toEqual(DESKTOP_POSES[0]);
    expect(poseAt(-3, DESKTOP_POSES)).toEqual(DESKTOP_POSES[0]);
    expect(poseAt(99, DESKTOP_POSES)).toEqual(DESKTOP_POSES[6]);
    const mid = poseAt(0.5, DESKTOP_POSES);
    expect(mid.opacity).toBeCloseTo((DESKTOP_POSES[0].opacity + DESKTOP_POSES[1].opacity) / 2);
    // No jump anywhere along the page.
    for (let i = 0; i < 6; i += 0.01) {
      expect(Math.abs(poseAt(i + 0.01, DESKTOP_POSES).x - poseAt(i, DESKTOP_POSES).x)).toBeLessThan(1.2);
    }
  });
});

describe('frames', () => {
  it('starts on the poster frame, turns forward with scroll and back again, and never leaves the sequence', () => {
    expect(frameAt(0, 0)).toBe(0);
    expect(frameAt(0.5, 3)).toBeGreaterThan(frameAt(0.2, 3));
    expect(frameAt(0.2, 3)).toBeLessThan(frameAt(0.5, 3));
    for (let p = 0; p <= 1; p += 0.05) {
      for (let s = 0; s < 40; s += 0.7) {
        expect(frameAt(p, s)).toBeGreaterThanOrEqual(0);
        expect(frameAt(p, s)).toBeLessThanOrEqual(FRAME_COUNT - 1);
      }
    }
  });

  it('drifts slowly when the page is still', () => {
    const perSecond = Math.abs(frameAt(0.3, 4.5) - frameAt(0.3, 3.5));
    expect(perSecond).toBeGreaterThan(0.5);
    expect(perSecond).toBeLessThan(6); // the source is 24 frames a second: this is a slow turn
  });

  it('damps towards the target without overshoot', () => {
    let v = 0;
    for (let i = 0; i < 600; i++) {
      const next = damp(v, 100, 6, 1 / 60);
      expect(next).toBeGreaterThanOrEqual(v);
      expect(next).toBeLessThanOrEqual(100);
      v = next;
    }
    expect(v).toBeCloseTo(100, 3);
  });

  it('loads every frame once, coarse pass first', () => {
    const order = loadOrder();
    expect(new Set(order).size).toBe(FRAME_COUNT);
    expect(order.slice(0, 12)).toEqual([0, 16, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176]);
  });
});

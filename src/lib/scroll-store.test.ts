import { describe, expect, it } from 'vitest';
import { computePoseIndex, POSE_ORDER, scrollState, toPoseOrderIndex } from './scroll-store';

describe('computePoseIndex', () => {
  const anchors = [400, 1200, 1500, 2600, 3100, 3900, 5000];

  it('returns 0 with no anchors or one anchor', () => {
    expect(computePoseIndex(123, [])).toBe(0);
    expect(computePoseIndex(-50, [800])).toBe(0);
    expect(computePoseIndex(800, [800])).toBe(0);
    expect(computePoseIndex(9999, [800])).toBe(0);
  });

  it('is exactly i on anchor i', () => {
    anchors.forEach((centre, i) => expect(computePoseIndex(centre, anchors)).toBe(i));
  });

  it('is linear between two anchors', () => {
    expect(computePoseIndex(800, anchors)).toBeCloseTo(0.5, 10);
    expect(computePoseIndex(1275, anchors)).toBeCloseTo(1.25, 10);
    expect(computePoseIndex(4725, anchors)).toBeCloseTo(5.75, 10);
  });

  it('clamps before the first and after the last anchor', () => {
    expect(computePoseIndex(-1000, anchors)).toBe(0);
    expect(computePoseIndex(0, anchors)).toBe(0);
    expect(computePoseIndex(5000.001, anchors)).toBe(6);
    expect(computePoseIndex(1e9, anchors)).toBe(6);
  });

  it('never leaves [0, n - 1] and never decreases as the viewport moves down', () => {
    let previous = -Infinity;
    for (let y = -500; y <= 6000; y += 7) {
      const index = computePoseIndex(y, anchors);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThanOrEqual(anchors.length - 1);
      expect(index).toBeGreaterThanOrEqual(previous);
      previous = index;
    }
  });

  it('is continuous: a small step in y is a small step in the index', () => {
    const step = 0.25;
    const shortestSegment = 300; // 1200 -> 1500
    for (let y = -100; y <= 5200; y += step) {
      const delta = computePoseIndex(y + step, anchors) - computePoseIndex(y, anchors);
      expect(delta).toBeLessThanOrEqual(step / shortestSegment + 1e-9);
    }
  });

  it('is continuous across each anchor', () => {
    for (const centre of anchors) {
      const below = computePoseIndex(centre - 1e-6, anchors);
      const above = computePoseIndex(centre + 1e-6, anchors);
      expect(above - below).toBeLessThan(1e-6);
    }
  });

  it('does not divide by zero when two anchors share a centre', () => {
    const index = computePoseIndex(500, [100, 500, 500, 900]);
    expect(Number.isFinite(index)).toBe(true);
    expect(computePoseIndex(700, [100, 500, 500, 900])).toBeCloseTo(2.5, 10);
  });

  it('returns 0 for a NaN viewport centre', () => {
    expect(computePoseIndex(Number.NaN, anchors)).toBe(0);
  });
});

describe('toPoseOrderIndex', () => {
  it('is the identity on the full home page', () => {
    const all = POSE_ORDER.map((_, i) => i);
    for (const value of [0, 0.5, 1, 2.75, 6]) {
      expect(toPoseOrderIndex(value, all)).toBeCloseTo(value, 10);
    }
  });

  it('maps a subset of sections to their own pose indices', () => {
    // A page with only services (1), process (4) and faq (5).
    const subset = [1, 4, 5];
    expect(toPoseOrderIndex(0, subset)).toBe(1);
    expect(toPoseOrderIndex(0.5, subset)).toBeCloseTo(2.5, 10);
    expect(toPoseOrderIndex(1, subset)).toBe(4);
    expect(toPoseOrderIndex(1.5, subset)).toBeCloseTo(4.5, 10);
    expect(toPoseOrderIndex(2, subset)).toBe(5);
  });

  it('returns 0 without anchors and clamps out-of-range input', () => {
    expect(toPoseOrderIndex(3, [])).toBe(0);
    expect(toPoseOrderIndex(-2, [2, 3])).toBe(2);
    expect(toPoseOrderIndex(9, [2, 3])).toBe(3);
  });
});

describe('contract', () => {
  it('has the seven poses in page order', () => {
    expect(POSE_ORDER).toEqual(['hero', 'services', 'work', 'demo', 'process', 'faq', 'contact']);
  });

  it('starts at rest', () => {
    expect(scrollState).toEqual({ y: 0, progress: 0, poseIndex: 0, vh: 0 });
  });
});

import type { GlassMode, Tier } from '@/lib/quality-store';

/**
 * Quality tiers and the controller that walks down them (ARCHITECTURE.md section 9, item 15).
 * No DOM and no renderer in here: the scene feeds it frame times and applies what it decides.
 */

/** What each running tier costs: resolution cap, ring detail and number of glow sprites. */
export const TIERS: Record<1 | 2 | 3, { dpr: number; around: number; edge: number; halos: number }> = {
  3: { dpr: 2, around: 192, edge: 16, halos: 2 },
  2: { dpr: 1.5, around: 112, edge: 10, halos: 2 },
  1: { dpr: 1, around: 72, edge: 6, halos: 1 },
};

/** Shortest time between rendered frames at half rate (tier 1, or a pose capped at 30fps), ms. */
export const HALF_RATE_GAP = 28;

const WINDOW = 90; // frames per measurement
const WARM_UP = 45; // frames ignored after mount, resume or a tier change
const LONG_GAP = 250; // ms; a longer frame is a hiccup (tab switch, GC), not a measurement
const SLOW = 24; // ms; a window with a median above this is slow (under about 42fps)
const TOO_SLOW = 50; // ms; tier 1 gives up only below 20fps, so a 30Hz phone stays at tier 1
const HEALTHY = 18; // ms; a window at or under this holds 60fps with headroom
const PROMOTE_AFTER = 6000; // ms of healthy windows before a phone gets real glass

/** Tier to start on: 3 with a mouse, 2 on touch screens, 1 on devices with little memory. */
export function startTier(device: { coarse: boolean; deviceMemory?: number }): 1 | 2 | 3 {
  if (device.deviceMemory !== undefined && device.deviceMemory <= 2) return 1;
  return device.coarse ? 2 : 3;
}

export type Controller = {
  /** Current tier. Only ever goes down. 0 means: stop rendering. */
  tier: Tier;
  glass: GlassMode;
  /** Median and 95th percentile frame time of the last full window, ms (0 before the first). */
  median: number;
  p95: number;
  /** Feed one frame time in ms. */
  frame(delta: number): void;
  /** Call after a pause (hidden tab): the next frames are warm-up. */
  resume(): void;
};

/**
 * `locked` keeps the tier and the glass where they start and only measures (the `?tier=` switch).
 * Glass: real from the start at tier 3 on fine pointers. On touch screens it starts lite, is
 * promoted once after six healthy seconds, and the first slow window demotes it for good.
 */
export function createController(start: { tier: 1 | 2 | 3; coarse: boolean; locked?: boolean }): Controller {
  const samples: number[] = [];
  let warmUp = WARM_UP;
  let slowWindows = 0;
  let healthyMs = 0;
  let mayPromote = start.coarse && start.tier === 2;

  const controller: Controller = {
    tier: start.tier,
    glass: !start.coarse && start.tier === 3 ? 'real' : 'lite',
    median: 0,
    p95: 0,
    resume() {
      warmUp = WARM_UP;
      samples.length = 0;
    },
    frame(delta) {
      if (delta > LONG_GAP || controller.tier === 0) return;
      if (warmUp > 0) {
        warmUp--;
        return;
      }
      samples.push(delta);
      if (samples.length < WINDOW) return;

      const total = samples.reduce((sum, value) => sum + value, 0);
      samples.sort((x, y) => x - y);
      controller.median = samples[WINDOW / 2];
      controller.p95 = samples[Math.floor(WINDOW * 0.95)];
      samples.length = 0;
      if (start.locked) return;

      const slow = controller.median > (controller.tier === 1 ? TOO_SLOW : SLOW);
      if (controller.median > SLOW) {
        // Frames slipped: glass is the cheapest thing to give up, and it stays off.
        controller.glass = 'lite';
        mayPromote = false;
      }
      healthyMs = controller.median <= HEALTHY ? healthyMs + total : 0;
      if (mayPromote && healthyMs >= PROMOTE_AFTER) {
        controller.glass = 'real';
        mayPromote = false;
      }

      slowWindows = slow ? slowWindows + 1 : 0;
      if (slowWindows === 2) {
        controller.tier = (controller.tier - 1) as Tier;
        slowWindows = 0;
        warmUp = WARM_UP;
      }
    },
  };
  return controller;
}

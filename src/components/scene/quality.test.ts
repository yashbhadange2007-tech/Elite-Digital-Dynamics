import { describe, expect, it } from 'vitest';
import { createController, startTier, type Controller } from './quality';

/** Mock clock: feed `count` frames of `ms` each. */
const feed = (controller: Controller, ms: number, count: number) => {
  for (let n = 0; n < count; n++) controller.frame(ms);
};
const WARM_UP = 45;
const WINDOW = 90;

describe('start tier', () => {
  it('is 3 with a mouse, 2 on touch, 1 with little memory', () => {
    expect(startTier({ coarse: false })).toBe(3);
    expect(startTier({ coarse: true, deviceMemory: 8 })).toBe(2);
    expect(startTier({ coarse: true, deviceMemory: 2 })).toBe(1);
    expect(startTier({ coarse: false, deviceMemory: 1 })).toBe(1);
  });
});

describe('quality controller', () => {
  it('steps down after two consecutive slow windows, not after one', () => {
    const controller = createController({ tier: 3, coarse: false });
    feed(controller, 30, WARM_UP + WINDOW);
    expect(controller.tier).toBe(3);
    expect(controller.median).toBe(30);
    feed(controller, 30, WINDOW - 1);
    expect(controller.tier).toBe(3);
    feed(controller, 30, 1);
    expect(controller.tier).toBe(2);
  });

  it('needs the two slow windows to be consecutive', () => {
    const controller = createController({ tier: 3, coarse: false });
    feed(controller, 30, WARM_UP + WINDOW);
    feed(controller, 16, WINDOW);
    feed(controller, 30, WINDOW);
    expect(controller.tier).toBe(3);
    feed(controller, 30, WINDOW);
    expect(controller.tier).toBe(2);
  });

  it('ignores warm-up frames after mount, after a tier change and after a resume', () => {
    const controller = createController({ tier: 3, coarse: false });
    feed(controller, 200, WARM_UP); // slow start-up frames: not measured
    feed(controller, 16, WINDOW * 4);
    expect(controller.tier).toBe(3);
    expect(controller.median).toBe(16);

    feed(controller, 30, WINDOW * 2); // step down to 2
    expect(controller.tier).toBe(2);
    feed(controller, 200, WARM_UP); // the hitch of the change itself: not measured
    feed(controller, 16, WINDOW * 2);
    expect(controller.tier).toBe(2);

    feed(controller, 30, WINDOW); // one slow window, then the tab is hidden and shown again
    controller.resume();
    feed(controller, 200, WARM_UP);
    feed(controller, 16, WINDOW);
    feed(controller, 30, WINDOW);
    expect(controller.tier).toBe(2);
  });

  it('ignores long gaps', () => {
    const controller = createController({ tier: 3, coarse: false });
    feed(controller, 16, WARM_UP);
    for (let n = 0; n < WINDOW * 4; n++) {
      controller.frame(16);
      controller.frame(900); // a hiccup between every pair of frames
    }
    expect(controller.tier).toBe(3);
    expect(controller.median).toBe(16);
  });

  it('never steps up, and tier 1 stops only below 20fps', () => {
    const controller = createController({ tier: 3, coarse: false });
    const seen: number[] = [];
    const phases = [30, 8, 30, 8, 33, 8, 60, 8];
    for (const ms of phases) {
      for (let n = 0; n < WINDOW * 6; n++) {
        controller.frame(ms);
        seen.push(controller.tier);
      }
    }
    for (let n = 1; n < seen.length; n++) expect(seen[n]).toBeLessThanOrEqual(seen[n - 1]);
    // 30ms twice took it to 1; 33ms (a 30Hz phone) kept it at 1; 60ms stopped it.
    expect(seen[WINDOW * 6 * 5 - 1]).toBe(1);
    expect(controller.tier).toBe(0);
    feed(controller, 8, WINDOW * 10);
    expect(controller.tier).toBe(0);
  });

  it('glass is real from the start with a mouse and goes lite for good when frames slip', () => {
    const controller = createController({ tier: 3, coarse: false });
    expect(controller.glass).toBe('real');
    feed(controller, 30, WARM_UP + WINDOW);
    expect(controller.glass).toBe('lite');
    expect(controller.tier).toBe(3); // glass goes first, the tier only on the second slow window
    feed(controller, 8, WINDOW * 20);
    expect(controller.glass).toBe('lite');
  });

  it('glass on touch starts lite, is promoted once after 6 healthy seconds, then demoted for good', () => {
    const controller = createController({ tier: 2, coarse: true });
    expect(controller.glass).toBe('lite');
    feed(controller, 16, WARM_UP + WINDOW * 4); // 5.8 s measured
    expect(controller.glass).toBe('lite');
    feed(controller, 16, WINDOW);
    expect(controller.glass).toBe('real');

    feed(controller, 30, WINDOW);
    expect(controller.glass).toBe('lite');
    feed(controller, 16, WINDOW * 20);
    expect(controller.glass).toBe('lite');
    expect(controller.tier).toBe(2);
  });

  it('glass is not promoted while frames are merely acceptable, or on a low-memory start', () => {
    const acceptable = createController({ tier: 2, coarse: true });
    feed(acceptable, 22, WARM_UP + WINDOW * 20);
    expect(acceptable.glass).toBe('lite');
    expect(acceptable.tier).toBe(2);

    const lowMemory = createController({ tier: 1, coarse: true });
    feed(lowMemory, 16, WARM_UP + WINDOW * 20);
    expect(lowMemory.glass).toBe('lite');
  });

  it('a locked controller measures but changes nothing', () => {
    const controller = createController({ tier: 3, coarse: false, locked: true });
    feed(controller, 80, WARM_UP + WINDOW * 6);
    expect(controller.tier).toBe(3);
    expect(controller.glass).toBe('real');
    expect(controller.median).toBe(80);
  });
});

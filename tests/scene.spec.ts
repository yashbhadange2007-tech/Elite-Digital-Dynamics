import type { Page } from '@playwright/test';
import sharp from 'sharp';
import { expect, test } from './fixtures';

/**
 * The 3D scene on its preview route (stand-in sections, one per pose, and a stand-in logo stage).
 * `?scene=force` accepts the software renderer of this GPU-less machine; `?tier=1` holds the
 * cheapest live tier so slow software frames cannot trigger the step-down to the poster mid-test.
 */
const PREVIEW = '/preview/scene';
const LIVE = `${PREVIEW}?scene=force&tier=1`;

type Quat = { x: number; y: number; z: number; w: number };
type Solved = { x: number; y: number; r: number; a: { q: Quat }; b: { q: Quat } };
type SceneDebug = { ready: boolean; frames: number; poseIndex: number; state: string | null; solved: Solved | null };
declare global {
  interface Window {
    __scene?: SceneDebug;
  }
}

const sceneState = (page: Page) => page.locator('html').getAttribute('data-scene');
const frames = (page: Page) => page.evaluate(() => window.__scene!.frames);
const waitReady = (page: Page) => page.waitForFunction(() => window.__scene?.ready === true, null, { timeout: 45_000 });

/** The canvas alone, on a transparent page: RGBA pixels of the scene layer. */
async function canvasPixels(page: Page) {
  const style = await page.addStyleTag({
    content:
      'html, body { background: transparent !important }' +
      'body > :not([data-scene-layer]) { visibility: hidden !important }' +
      // Skip the fade-in: alpha values must be the canvas's own.
      '[data-scene-layer] > div { transition: none !important; opacity: 1 !important }',
  });
  const png = await page.locator('[data-scene-layer]').screenshot({ omitBackground: true });
  await style.evaluate((node) => (node as HTMLElement).remove());
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const scale = info.width / page.viewportSize()!.width;
  /** RGBA at a point given in CSS px. */
  const at = (x: number, y: number) => {
    const i = (Math.round(y * scale) * info.width + Math.round(x * scale)) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  };
  return { at, data, info };
}

test.describe('live', () => {
  test('S4: renders two red rings and a bright core on a transparent canvas, and keeps moving', async ({ page }, testInfo) => {
    await page.goto(`${PREVIEW}?scene=force`);
    await waitReady(page);
    expect(await sceneState(page)).toBe('live');

    const before = await frames(page);
    await page.waitForTimeout(2000);
    expect(await frames(page)).toBeGreaterThan(before + 3);

    await page.screenshot({ path: testInfo.snapshotPath('hero.png') });
    const solved = (await page.evaluate(() => window.__scene!.solved))!;
    const { at, data, info } = await canvasPixels(page);

    // Transparent away from the object, opaque bright red at the core.
    expect(at(2, 2).a).toBe(0);
    const core = at(solved.x, solved.y);
    expect(core.a).toBe(255);
    expect(core.r).toBeGreaterThan(200);
    expect(core.r).toBeGreaterThan(core.g + 60);

    // The rings: a good share of the layer is opaque, and what is opaque is red.
    let opaque = 0;
    let red = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 250) continue;
      opaque++;
      if (data[i] >= data[i + 1] && data[i] >= data[i + 2]) red++;
    }
    expect(opaque / (info.width * info.height)).toBeGreaterThan(0.03);
    expect(red / opaque).toBeGreaterThan(0.99);
  });

  test('S4: the additive glow sprites leave no box on the transparent canvas', async ({ page }) => {
    // The demo pose is small and sits inside the screen, so the corners of the glow quad are visible.
    await page.goto(`${PREVIEW}?scene=force&tier=3&pose=demo`); // tier 3 has both glow sprites
    await waitReady(page);
    const solved = (await page.evaluate(() => window.__scene!.solved))!;
    const { at } = await canvasPixels(page);
    // Down and left of the core (on screen at every viewport). Inside the glow disc there is light;
    // in the corner of its square quad (beyond the disc, beyond every ring) the canvas must be
    // fully transparent.
    const diagonal = (distance: number) => at(solved.x - (distance * solved.r) / Math.SQRT2, solved.y + (distance * solved.r) / Math.SQRT2);
    expect(diagonal(1.3).a).toBeGreaterThan(0);
    expect(diagonal(1.9).a).toBe(0);
    expect(diagonal(2.2).a).toBe(0);
  });

  test('S7: scroll jumps pass through the poses without a snap, and the logo lands on its stage', async ({ page }) => {
    await page.goto(LIVE);
    await waitReady(page);

    // Records the solver's output once per rendered frame.
    await page.evaluate(() => {
      const log: { p: number; x: number; y: number; r: number; qa: number[]; qb: number[]; scrollY: number }[] = [];
      (window as unknown as { __log: typeof log }).__log = log;
      let seen = -1;
      const tick = () => {
        const scene = window.__scene!;
        if (scene.solved && scene.frames !== seen) {
          seen = scene.frames;
          const { x, y, r, a, b } = scene.solved;
          const q = (v: Quat) => [v.x, v.y, v.z, v.w];
          log.push({ p: scene.poseIndex, x, y, r, qa: q(a.q), qb: q(b.q), scrollY: window.scrollY });
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const settle = (index: number) =>
      page.waitForFunction((i) => Math.abs(window.__scene!.poseIndex - i) < 1e-3, index, { timeout: 30_000 });
    const jumpTo = (top: number) => page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);
    const stage = await page.evaluate(() => {
      const rect = document.querySelector('[data-logo-stage]')!.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, top: rect.top + window.scrollY, size: rect.width };
    });
    const viewport = page.viewportSize()!;
    const onStage = stage.top + stage.size / 2 - viewport.height / 2;

    await jumpTo(onStage); // hero to contact in one frame
    await settle(6);
    await page.waitForTimeout(600);
    await jumpTo(onStage * 0.45); // back, into the middle of the page
    await page.waitForTimeout(700);
    await jumpTo(onStage); // reverse before it has arrived
    await settle(6);
    await page.waitForTimeout(600);

    // On the stage: centred on it, sized like the mark in its 64-unit box (ring A radius 22).
    const centred = async () => {
      const [solved, top] = await page.evaluate(() => [window.__scene!.solved!, document.querySelector('[data-logo-stage]')!.getBoundingClientRect().top] as const);
      expect(Math.abs(solved.x - stage.x)).toBeLessThan(1.5);
      expect(Math.abs(solved.y - (top + stage.size / 2))).toBeLessThan(1.5);
      expect(Math.abs(solved.r - (stage.size * 22) / 64)).toBeLessThan(1);
    };
    await centred();
    await jumpTo(onStage + 90); // scroll a little further: it stays attached
    await page.waitForTimeout(400);
    await centred();
    await jumpTo(0);
    await settle(0);

    // Per rendered frame the solver advances at most 50 ms, so each step is bounded by the rate
    // limits derived in src/components/scene/solver.test.ts times 0.05 s:
    //   damped index 2.5 poses/s, ring orientation 8.5 rad/s, position 3.94 x (viewport diagonal
    //   plus the stage's reach) px/s. Movement that is the page scrolling under the attached
    //   logo is not the solver's: frames next to a scroll jump are left out of the position check.
    const log = await page.evaluate(() => (window as unknown as { __log: { p: number; x: number; y: number; qa: number[]; qb: number[]; scrollY: number }[] }).__log);
    expect(log.length).toBeGreaterThan(60);
    const angle = (q1: number[], q2: number[]) => 2 * Math.acos(Math.min(1, Math.abs(q1[0] * q2[0] + q1[1] * q2[1] + q1[2] * q2[2] + q1[3] * q2[3])));
    const moveLimit = 3.94 * Math.hypot(viewport.width, viewport.height + 440) * 0.05;
    const visited = new Set<number>();
    for (let n = 1; n < log.length; n++) {
      const now = log[n];
      const prev = log[n - 1];
      visited.add(Math.round(now.p));
      expect(Math.abs(now.p - prev.p)).toBeLessThanOrEqual(0.126);
      expect(angle(now.qa, prev.qa)).toBeLessThanOrEqual(0.43);
      expect(angle(now.qb, prev.qb)).toBeLessThanOrEqual(0.43);
      const nearJump = [n - 2, n - 1, n, n + 1].some((k) => log[k] && log[k + 1] && log[k].scrollY !== log[k + 1].scrollY);
      if (!nearJump) expect(Math.hypot(now.x - prev.x, now.y - prev.y)).toBeLessThanOrEqual(moveLimit);
    }
    expect([...visited].sort()).toEqual([0, 1, 2, 3, 4, 5, 6]); // every pose on the way, none skipped
  });

  test('S9: a hidden tab stops the frames, a visible one resumes them', async ({ page }) => {
    await page.goto(LIVE);
    await waitReady(page);
    const setHidden = (hidden: boolean) =>
      page.evaluate((value) => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (value ? 'hidden' : 'visible') });
        document.dispatchEvent(new Event('visibilitychange'));
      }, hidden);

    await setHidden(true);
    await page.waitForTimeout(300); // a frame already asked for may still land
    const paused = await frames(page);
    await page.waitForTimeout(1000);
    expect(await frames(page)).toBe(paused);

    await setHidden(false);
    await page.waitForTimeout(1500);
    expect(await frames(page)).toBeGreaterThan(paused + 2);
  });

  test('S11: a lost WebGL context ends on the poster', async ({ page }) => {
    await page.goto(LIVE);
    await waitReady(page);
    await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-scene-layer] canvas')!;
      canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext();
    });
    await expect(page.locator('html')).toHaveAttribute('data-scene', 'poster');
    await expect(page.locator('[data-scene-layer] canvas')).toHaveCount(0);
    const poster = page.locator('[data-scene-layer] img');
    await expect(poster).toBeVisible();
    await expect.poll(() => poster.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  });
});

test.describe('still', () => {
  /** One frozen frame, and the layer is a picture in the hero, not a fixed background. */
  async function expectStill(page: Page) {
    await expect(page.locator('html')).toHaveAttribute('data-scene', 'still');
    await page.waitForTimeout(700);
    const frozen = await frames(page);
    expect(frozen).toBeGreaterThan(0);
    await page.waitForTimeout(1000);
    expect(await frames(page)).toBe(frozen);

    const layer = page.locator('[data-scene-layer]');
    await expect(layer).toHaveCSS('position', 'absolute');
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
    await expect.poll(() => layer.evaluate((el) => el.getBoundingClientRect().top)).toBe(-400);
    expect(await frames(page)).toBe(frozen); // scrolling does not wake it
  }

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('S10: one frame of the hero pose that scrolls away', async ({ page }, testInfo) => {
      await page.goto(`${PREVIEW}?scene=force&tier=1`);
      await waitReady(page);
      await page.waitForTimeout(900); // the fade-in
      await page.screenshot({ path: testInfo.snapshotPath('still.png') });
      await expectStill(page);
    });
  });

  test('S10: the Pause motion control freezes a live scene', async ({ page }) => {
    await page.goto(LIVE);
    await waitReady(page);
    expect(await sceneState(page)).toBe('live');
    await expect(page.locator('[data-scene-layer]')).toHaveCSS('position', 'fixed');
    const pause = page.getByRole('button', { name: 'Pause background motion' });
    await pause.focus();
    await page.keyboard.press('Enter');
    await expectStill(page);
  });
});

test.describe('poster', () => {
  /** True when a JavaScript response is (or contains) three.js. Survives minification: it is a log string. */
  const isThree = (body: string) => body.includes('THREE.WebGLRenderer');

  async function scriptBodies(page: Page, url: string) {
    const bodies: Promise<string>[] = [];
    page.on('response', (response) => {
      if (response.request().resourceType() === 'script') bodies.push(response.text().catch(() => ''));
    });
    await page.goto(url);
    await page.waitForFunction(() => window.__scene?.state != null && (window.__scene.ready || window.__scene.state === 'poster'), null, { timeout: 45_000 });
    await page.waitForTimeout(1500);
    return Promise.all(bodies);
  }

  test('S11: without WebGL the hero shows the poster and three.js is never requested', async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
        if (kind.includes('webgl')) return null;
        return (original as (...args: unknown[]) => unknown).call(this, kind, ...rest);
      } as typeof original;
    });
    const bodies = await scriptBodies(page, `${PREVIEW}?scene=force`);
    expect(await sceneState(page)).toBe('poster');
    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.filter(isThree)).toHaveLength(0);

    const poster = page.locator('[data-scene-layer] img');
    await expect(poster).toBeVisible();
    const wide = page.viewportSize()!.width >= 1024;
    await expect.poll(() => poster.evaluate((img: HTMLImageElement) => img.currentSrc)).toContain(wide ? 'poster-desktop.webp' : 'poster-mobile.webp');
    await expect.poll(() => poster.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator('[data-scene-layer]')).toHaveCSS('position', 'absolute');
    await expect(page.locator('canvas')).toHaveCount(0);
    await page.screenshot({ path: testInfo.snapshotPath('poster.png') });
  });

  test('S4: a browser that reports a slow software renderer gets the poster unless forced', async ({ page }) => {
    // Headless Chromium here does not report its software renderer as a performance caveat, so
    // the refusal is simulated: no context when the page asks with failIfMajorPerformanceCaveat.
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, options?: { failIfMajorPerformanceCaveat?: boolean }) {
        if (kind.includes('webgl') && options?.failIfMajorPerformanceCaveat) return null;
        return (original as (...args: unknown[]) => unknown).call(this, kind, options);
      } as typeof original;
    });
    const bodies = await scriptBodies(page, PREVIEW);
    expect(await sceneState(page)).toBe('poster');
    expect(bodies.filter(isThree)).toHaveLength(0);

    await page.goto(`${PREVIEW}?scene=force&tier=1`);
    await waitReady(page);
    expect(await sceneState(page)).toBe('live');
  });

  test('S12: no canvas in the HTML, the scene loads after first paint, and it is not the largest paint', async ({ page, request }) => {
    const html = await (await request.get(`${PREVIEW}?scene=force`)).text();
    expect(html).not.toContain('<canvas');
    expect(html).toContain('data-scene-layer');

    const three: string[] = [];
    page.on('response', async (response) => {
      if (response.request().resourceType() !== 'script') return;
      if (isThree(await response.text().catch(() => ''))) three.push(response.url());
    });
    await page.goto(`${PREVIEW}?scene=force&tier=1`);
    await waitReady(page);
    await expect.poll(() => three.length).toBeGreaterThan(0); // sanity: in live mode three.js does load

    const timing = await page.evaluate(
      (urls) =>
        new Promise<{ firstPaint: number; chunkStart: number; largest: string }>((resolve) => {
          new PerformanceObserver((list) => {
            const last = list.getEntries().at(-1) as PerformanceEntry & { element?: Element };
            const paint = performance.getEntriesByType('paint').find((entry) => entry.name === 'first-paint');
            const starts = performance.getEntriesByType('resource').filter((entry) => urls.includes(entry.name)).map((entry) => entry.startTime);
            resolve({
              firstPaint: paint?.startTime ?? Infinity,
              chunkStart: Math.min(...starts),
              largest: last.element?.tagName ?? 'unknown',
            });
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        }),
      three,
    );
    expect(timing.chunkStart).toBeGreaterThan(timing.firstPaint);
    expect(timing.largest).not.toBe('CANVAS');
    expect(timing.largest).not.toBe('unknown');
  });
});

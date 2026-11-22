import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import sharp from 'sharp';
import { expect, test } from './fixtures';

/**
 * The video sculpture, the intro and the re-theme's promises (DESIGN.md 2 and 9, SPEC.md 5).
 * Runs against the real home page at 375, 768 and 1440.
 */

type Probe = { mode: 'still' | 'desktop' | 'phone'; frame: number; loaded: number };
const probe = (page: Page) => page.evaluate(() => (window as unknown as { __sculpture?: Probe }).__sculpture);
const isWide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;
const scrollTo = (page: Page, top: number) => page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);
const stageOpacity = (page: Page) =>
  page.locator('.sculpture-stage').evaluate((el) => parseFloat(getComputedStyle(el).opacity));
const root = path.resolve(__dirname, '..');

test('the poster is in the HTML, so nothing waits for media', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toContain('/sculpture/phone-poster.webp');
  expect(html).toContain('/sculpture/desktop-poster.webp');
  expect(html).not.toMatch(/<canvas|<video/);
  for (const file of ['phone-poster.webp', 'desktop-poster.webp']) {
    expect((await request.get(`/sculpture/${file}`)).headers()['content-type']).toBe('image/webp');
  }
});

test('desktop: scroll turns the sculpture forward and back, and it dims behind content', async ({ page }, testInfo) => {
  test.skip(!isWide(page), 'desktop only');
  await page.goto('/');
  await expect.poll(async () => (await probe(page))?.loaded, { timeout: 30_000 }).toBe(190);
  expect((await probe(page))!.mode).toBe('desktop');

  const layer = page.locator('[data-sculpture]');
  await expect(layer).toHaveAttribute('data-live', '');
  expect(await layer.evaluate((el) => getComputedStyle(el).position)).toBe('fixed');
  await expect(page.locator('.sculpture canvas')).toHaveAttribute('data-ready', '');
  expect(await page.locator('.sculpture video').count()).toBe(0);

  // Drawn, not blank: the core is bright.
  const brightest = await page.locator('.sculpture canvas').evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext('2d')!.getImageData(700, 250, 440, 320).data;
    let max = 0;
    for (let i = 0; i < data.length; i += 4) max = Math.max(max, data[i] + data[i + 1] + data[i + 2]);
    return max;
  });
  expect(brightest).toBeGreaterThan(500);

  const top = (await probe(page))!.frame;
  expect(top).toBeLessThan(24);
  expect(await stageOpacity(page)).toBeGreaterThan(0.95);
  await page.screenshot({ path: testInfo.snapshotPath('hero.png') });

  // Idle: it keeps drifting.
  await page.waitForTimeout(1500);
  expect(Math.abs((await probe(page))!.frame - top)).toBeGreaterThan(0.2);

  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await scrollTo(page, height * 0.6);
  await page.waitForTimeout(1600);
  const down = (await probe(page))!.frame;
  expect(down, 'scrolling down turns it forward').toBeGreaterThan(top + 40);
  expect(await stageOpacity(page), 'dim behind content (DESIGN.md 2)').toBeLessThanOrEqual(0.3);

  // Eased, not jumped: right after a big scroll the frame has not arrived yet.
  await scrollTo(page, 0);
  await page.waitForTimeout(60);
  expect((await probe(page))!.frame).toBeGreaterThan(top + 5);
  await page.waitForTimeout(1600);
  expect((await probe(page))!.frame, 'scrolling up turns it back').toBeLessThan(down - 40);
  expect(await stageOpacity(page)).toBeGreaterThan(0.95);
});

test('phone and tablet: the clip plays on its own and scroll only moves the layer', async ({ page }, testInfo) => {
  test.skip(isWide(page), 'phone and tablet only');
  await page.goto('/');
  const video = page.locator('.sculpture video');
  await expect(video).toHaveCount(1);
  expect(await page.locator('.sculpture canvas').count()).toBe(0);
  const state = () =>
    video.evaluate((v: HTMLVideoElement) => ({ t: v.currentTime, paused: v.paused, muted: v.muted, loop: v.loop, inline: v.playsInline, w: v.videoWidth, h: v.videoHeight }));
  await expect.poll(async () => (await state()).t, { timeout: 15_000 }).toBeGreaterThan(0.2);
  const playing = await state();
  expect(playing).toMatchObject({ paused: false, muted: true, loop: true, inline: true, w: 720, h: 800 });

  const viewport = page.viewportSize()!;
  const box = (await video.boundingBox())!;
  if (viewport.width < 480) expect(box.width / viewport.width, 'about 90% of the screen wide').toBeCloseTo(0.9, 1);
  await page.screenshot({ path: testInfo.snapshotPath('hero.png') });

  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await scrollTo(page, height * 0.5);
  await page.waitForTimeout(1500);
  expect(await page.locator('[data-sculpture]').evaluate((el) => getComputedStyle(el).position)).toBe('fixed');
  expect(await stageOpacity(page), 'dim behind content (DESIGN.md 2)').toBeLessThanOrEqual(0.25);
  const moved = (await video.boundingBox())!;
  expect(Math.abs(moved.x + moved.width / 2 - viewport.width / 2), 'still centred, never pushed aside').toBeLessThan(2);
  expect(moved.y + moved.height / 2).toBeGreaterThan(viewport.height * 0.25);
  expect(moved.y + moved.height / 2).toBeLessThan(viewport.height * 0.75);

  // Playing at its own speed, not scrubbed by the scroll: about 0.8 s passes in 0.8 s (or it looped).
  const before = (await state()).t;
  await page.waitForTimeout(800);
  const after = (await state()).t;
  const elapsed = after >= before ? after - before : after + 5.33 - before;
  expect(elapsed).toBeGreaterThan(0.4);
  expect(elapsed).toBeLessThan(1.4);
});

test.describe('still page', () => {
  test.use({ skipIntro: false });

  test('reduced motion: a still poster that scrolls away, no canvas, no video, no intro', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'still');
    await expect(page.locator('html')).not.toHaveAttribute('data-intro');
    await expect(page.locator('.intro')).toBeHidden();
    await page.waitForTimeout(1200);
    const layer = page.locator('[data-sculpture]');
    await expect(layer).toHaveAttribute('data-sculpture', 'still');
    await expect(layer).not.toHaveAttribute('data-live');
    expect(await page.locator('.sculpture canvas, .sculpture video').count()).toBe(0);
    expect(await layer.evaluate((el) => getComputedStyle(el).position)).toBe('absolute');
    expect(await page.locator('.sculpture img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await page.screenshot({ path: testInfo.snapshotPath('still.png') });

    // Nothing moves: two screenshots a moment apart are identical.
    const first = await page.screenshot();
    await page.waitForTimeout(700);
    expect((await page.screenshot()).equals(first)).toBe(true);
  });

  test('phone: refused autoplay leaves the poster, and the page still looks finished', async ({ page }) => {
    test.skip(isWide(page), 'phone and tablet only');
    await page.addInitScript(() => {
      sessionStorage.setItem('edd-intro', '1');
      HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('low power', 'NotAllowedError'));
    });
    await page.goto('/');
    await expect(page.locator('[data-sculpture]')).toHaveAttribute('data-sculpture', 'still');
    await expect(page.locator('.sculpture video')).toHaveCount(0);
    await expect(page.locator('.sculpture img')).toBeVisible();
  });
});

test.describe('intro', () => {
  test.use({ skipIntro: false });

  test('plays once per session, about 1.5 s, and never blocks the page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-intro', 'play');
    const intro = page.locator('.intro');
    await expect(intro).toBeVisible();
    expect(await intro.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
    expect((await intro.innerText()).replace(/\s+/g, '')).toBe('ELITEDIGITALDYNAMICS');
    // The page is already there underneath.
    await expect(page.locator('h1')).toHaveCount(1);

    await expect(html).not.toHaveAttribute('data-intro', { timeout: 2500 });
    await expect(intro).toBeHidden();

    await page.reload({ waitUntil: 'commit' });
    await page.waitForTimeout(300);
    await expect(html).not.toHaveAttribute('data-intro');
  });

  for (const how of ['key', 'tap', 'scroll'] as const) {
    test(`a ${how} skips it at once`, async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const html = page.locator('html');
      await expect(html).toHaveAttribute('data-intro', 'play');
      if (how === 'key') await page.keyboard.press('Tab');
      if (how === 'tap') await page.locator('body').dispatchEvent('pointerdown');
      if (how === 'scroll') await page.evaluate(() => window.scrollTo(0, 200));
      await expect(html).not.toHaveAttribute('data-intro', { timeout: 400 });
      await expect(page.locator('.intro')).toBeHidden();
    });
  }
});

test('no watermark: the generator sparkle is gone from the desktop frames and outside the phone crop', async () => {
  // In the source the sparkle's centre is about 75 levels brighter than the ring just outside it.
  // Frame coordinates at 1440x810: centre (1305, 675); the star's points end 27px out.
  let diff = 0;
  const frames = [0, 12, 30, 45, 60, 95, 120, 140, 165, 189];
  for (const n of frames) {
    const file = path.join(root, 'public/sculpture/d', `${String(n).padStart(3, '0')}.webp`);
    const { data, info } = await sharp(file).extract({ left: 1305 - 44, top: 675 - 44, width: 88, height: 88 }).greyscale().raw().toBuffer({ resolveWithObject: true });
    let inside = 0, insideCount = 0, around = 0, aroundCount = 0;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const r = Math.hypot(x - 44, y - 44);
        if (r < 8) {
          inside += data[y * info.width + x];
          insideCount++;
        } else if (r > 33 && r < 42) {
          around += data[y * info.width + x];
          aroundCount++;
        }
      }
    }
    diff += inside / insideCount - around / aroundCount;
  }
  expect(Math.abs(diff / frames.length), 'sparkle centre against its surroundings').toBeLessThan(8);

  // Phone: the clip is the 1080x1200 crop that ends 340px above the sparkle.
  const poster = await sharp(path.join(root, 'public/sculpture/phone-poster.webp')).metadata();
  expect([poster.width, poster.height]).toEqual([720, 800]);
});

test('media budgets and the old scene is gone', async () => {
  const size = (file: string) => readFileSync(path.join(root, file)).length;
  expect(size('public/sculpture/phone.mp4')).toBeLessThanOrEqual(1.5e6);
  let frames = 0;
  for (let n = 0; n < 190; n++) frames += size(`public/sculpture/d/${String(n).padStart(3, '0')}.webp`);
  expect(frames).toBeLessThanOrEqual(4e6);
  expect(size('public/sculpture/desktop-poster.webp')).toBeLessThanOrEqual(100e3);
  expect(size('public/sculpture/phone-poster.webp')).toBeLessThanOrEqual(100e3);

  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const name of ['three', '@react-three/fiber', '@react-three/drei', 'maath', '@types/three']) {
    expect({ ...pkg.dependencies, ...pkg.devDependencies }, name).not.toHaveProperty([name]);
  }
  expect(existsSync(path.join(root, 'src/components/scene'))).toBe(false);
  expect(existsSync(path.join(root, 'public/scene'))).toBe(false);
  expect(existsSync(path.join(root, 'public/source-media'))).toBe(false); // originals are never shipped
});

test('copy: "local business" appears nowhere, and no red is left in the theme', async ({ page, request }) => {
  for (const url of ['/', '/privacy', '/manifest.webmanifest', '/sitemap.xml']) {
    expect((await (await request.get(url)).text()).toLowerCase(), url).not.toMatch(/local[- ]business/);
  }
  await page.goto('/');
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return { bg: style.getPropertyValue('--color-bg').trim().toUpperCase(), ember: style.getPropertyValue('--color-ember-600').trim(), salmon: style.getPropertyValue('--color-salmon').trim() };
  });
  expect(tokens).toEqual({ bg: '#05070D', ember: '', salmon: '' });
  // The primary button is pink with navy text; white on this pink would fail contrast.
  const button = page.locator('#top').getByRole('link', { name: 'Start a project' });
  expect(await button.evaluate((el) => [getComputedStyle(el).backgroundColor, getComputedStyle(el).color])).toEqual(['rgb(255, 46, 147)', 'rgb(5, 7, 13)']);
});

/** WCAG relative luminance of an sRGB colour. */
function luminance(r: number, g: number, b: number): number {
  const lin = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

test('text stays readable over the sculpture at every scroll position (WCAG AA on real pixels)', async ({ page }) => {
  test.slow();
  await page.goto('/');
  if (isWide(page)) await expect.poll(async () => (await probe(page))?.loaded ?? 0, { timeout: 30_000 }).toBeGreaterThan(40);
  else await expect.poll(() => page.locator('.sculpture video').evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0.1);

  const viewport = page.viewportSize()!;
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const failures: string[] = [];
  let checked = 0;

  for (let y = 0; y < height - viewport.height / 2; y += Math.round(viewport.height * 0.8)) {
    await scrollTo(page, y);
    await page.waitForTimeout(1000); // the pose settles

    // Every run of visible text in the page, with its colour and size.
    const items = await page.evaluate(() => {
      const out: { text: string; color: string; size: number; weight: number; x: number; y: number; w: number; h: number }[] = [];
      // Page text that has scrolled under the sticky nav is covered by it, not shown: skip it.
      const navBottom = document.querySelector('body > header')!.getBoundingClientRect().bottom;
      for (const scope of document.querySelectorAll('body > header, main, body > footer')) {
        const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node.textContent?.trim() ?? '';
          const el = node.parentElement;
          if (!text || !el || el.closest('.visually-hidden, [data-screen], [popover]:not(:popover-open)')) continue; // the demo app has its own palette and tests
          if (!el.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })) continue; // e.g. a closed FAQ answer
          const style = getComputedStyle(el);
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            if (scope.tagName !== 'HEADER' && rect.top < navBottom) continue;
            if (rect.width < 6 || rect.height < 6 || rect.top < 0 || rect.bottom > innerHeight || rect.left < 0 || rect.right > innerWidth) continue;
            out.push({ text: text.slice(0, 40), color: style.color, size: parseFloat(style.fontSize), weight: Number(style.fontWeight), x: rect.left, y: rect.top, w: rect.width, h: rect.height });
          }
        }
      }
      return out;
    });

    // The same screen with the text removed: what is left is exactly what sits behind each glyph.
    const hide = await page.addStyleTag({
      content: '*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; transition: none !important; } ::marker, ::placeholder { color: transparent !important; }',
    });
    const shot = await page.screenshot();
    await hide.evaluate((el) => (el as Element).remove());
    const { data, info } = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const scale = info.width / viewport.width;

    for (const item of items) {
      const [, r, g, b] = /rgba?\((\d+), (\d+), (\d+)/.exec(item.color)!.map(Number);
      const text = luminance(r, g, b);
      const behind: number[] = [];
      const x0 = Math.floor(item.x * scale), x1 = Math.min(Math.ceil((item.x + item.w) * scale), info.width);
      const y0 = Math.floor(item.y * scale), y1 = Math.min(Math.ceil((item.y + item.h) * scale), info.height);
      for (let py = y0; py < y1; py += 2) {
        for (let px = x0; px < x1; px += 2) {
          const i = (py * info.width + px) * 3;
          behind.push(luminance(data[i], data[i + 1], data[i + 2]));
        }
      }
      if (behind.length < 4) continue;
      behind.sort((a, b2) => a - b2);
      // Worst case within the glyph box, ignoring 5% outliers (a sparkle, a hairline).
      const worst = Math.min(ratio(text, behind[Math.floor(behind.length * 0.05)]), ratio(text, behind[Math.floor(behind.length * 0.95)]));
      const large = item.size >= 24 || (item.size >= 18.66 && item.weight >= 700);
      checked++;
      if (worst < (large ? 3 : 4.5)) failures.push(`${worst.toFixed(2)} at scroll ${y}: "${item.text}" (${item.color}, ${item.size}px)`);
    }
  }

  expect(checked).toBeGreaterThan(60);
  expect(failures, 'contrast below WCAG AA').toEqual([]);
});

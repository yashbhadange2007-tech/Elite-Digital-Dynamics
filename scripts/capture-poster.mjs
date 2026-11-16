/**
 * Renders the two poster images from the real scene: the hero pose, still, on a transparent
 * background. The posters stand in for the scene where WebGL is missing or too slow.
 *
 *   node scripts/capture-poster.mjs          (the dev server must be running; BASE_URL overrides
 *                                             http://localhost:3000)
 *
 * Writes public/scene/poster-mobile.webp and public/scene/poster-desktop.webp.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const sharp = require('sharp');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
// Software WebGL: build machines have no GPU.
const WEBGL_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const SHOTS = [
  { name: 'poster-mobile', width: 375, height: 812, scale: 2, mobile: true },
  { name: 'poster-desktop', width: 1440, height: 900, scale: 1.5, mobile: false },
];

const browser = await chromium.launch({ args: WEBGL_ARGS });
for (const shot of SHOTS) {
  const context = await browser.newContext({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: shot.scale,
    isMobile: shot.mobile,
    hasTouch: shot.mobile,
  });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/preview/scene?pose=hero&still=1&tier=3&scene=force`);
  await page.waitForFunction(() => window.__scene?.ready === true, null, { timeout: 60_000 });
  // Only the scene layer may be in the picture: no glow, scrim, nav or page background.
  await page.addStyleTag({
    content:
      'html, body { background: transparent !important }' +
      'body > :not([data-scene-layer]) { visibility: hidden !important }' +
      '[data-scene-layer] * { transition: none !important; opacity: 1 !important }',
  });
  await page.waitForTimeout(500);
  const png = await page.locator('[data-scene-layer]').screenshot({ omitBackground: true });
  const file = fileURLToPath(new URL(`../public/scene/${shot.name}.webp`, import.meta.url));
  const info = await sharp(png).webp({ quality: 82, alphaQuality: 90 }).toFile(file);
  console.log(`${shot.name}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} kB`);
  await context.close();
}
await browser.close();

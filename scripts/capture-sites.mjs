// Full-page screenshots of each client site at 390 and 1280 wide, cut into WebP tiles in
// public/work/<slug>/{mobile,desktop}-NN.webp, and the tile list written to the `shots` field of
// src/components/work/sites.data.json. Usage: node scripts/capture-sites.mjs [slug ...]
//
// Capture notes (docs/research/sites.md): launch WITHOUT the GPU flags and capture in clip tiles
// (full-page capture wraps after about 8192px with them); scroll once so reveal content shows;
// wait for the hotel's preloader and Goodlife Fitness Club's counters. Google Maps is unreachable
// from the build container, so each site's map box is an empty dark box in captures made there.
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import sharp from 'sharp';

const { chromium } = createRequire(import.meta.url)('playwright');
const DATA = new URL('../src/components/work/sites.data.json', import.meta.url);
const OUT = new URL('../public/work/', import.meta.url);
const TILE = 2048; // CSS px per tile; at most 2048 * 1.5 = 3072 image px (limit 4096)
const QUALITY = 62;
const SETTLE = { 'hotel-orient-elite': 3000, 'goodlife-fitness-club': 4000 }; // preloader, counters
const DEVICES = {
  mobile: {
    key: 'phone',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1.5,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
  },
  desktop: { key: 'laptop', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sites = JSON.parse(await readFile(DATA, 'utf8'));
const only = process.argv.slice(2);
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch({ proxy: proxy ? { server: proxy, bypass: 'localhost,127.0.0.1' } : undefined });

for (const site of sites.filter((s) => !only.length || only.includes(s.slug))) {
  const dir = new URL(`${site.slug}/`, OUT);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  site.shots = {};
  let bytes = 0;
  for (const [name, { key, ...options }] of Object.entries(DEVICES)) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    await page.goto(site.url, { waitUntil: 'load', timeout: 90_000 });
    await sleep(SETTLE[site.slug] ?? 1500);
    // Scroll through once so scroll-reveal content and lazy images appear, then back to the top.
    for (let y = 0; y < (await page.evaluate(() => document.documentElement.scrollHeight)); y += 500) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
      await sleep(120);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await sleep(1500);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const width = options.viewport.width;
    const tiles = [];
    for (let y = 0, n = 1; y < height; y += TILE, n++) {
      const clip = { x: 0, y, width, height: Math.min(TILE, height - y) };
      const png = await page.screenshot({ clip, fullPage: true, timeout: 60_000 });
      const file = `${name}-${String(n).padStart(2, '0')}.webp`;
      const webp = await sharp(png).webp({ quality: QUALITY }).toBuffer();
      await writeFile(new URL(file, dir), webp);
      const meta = await sharp(webp).metadata();
      tiles.push({ src: `/work/${site.slug}/${file}`, width: meta.width, height: meta.height });
      bytes += webp.length;
    }
    site.shots[key] = tiles;
    console.log(`${site.slug} ${name}: ${width}x${height} css px, ${tiles.length} tiles`);
    await context.close();
  }
  console.log(`${site.slug}: ${bytes} bytes in total`);
}

await browser.close();
await writeFile(DATA, JSON.stringify(sites, null, 2) + '\n');

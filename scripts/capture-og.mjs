// Renders the 1200x630 share image to src/app/opengraph-image.png (and its alt text file).
// Everything is inline (font as a data URL, the owner's mark as inline SVG); any network request aborts.
// Run: node scripts/capture-og.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import sharp from 'sharp';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = new URL('../', import.meta.url);
const read = (path, enc) => readFile(new URL(path, root), enc);

const font = (await read('src/fonts/Manrope-Variable.woff2')).toString('base64');
const mark = await read('public/brand/edd-mark.svg', 'utf8');

// Values from DESIGN.md: --color-bg, the .page-glow gradient, --color-text, --color-blue-300.
const html = `<!doctype html><html><head><style>
@font-face { font-family: Manrope; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 200 800; }
* { margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; background: #05070D; font-family: Manrope; color: #FFFFFF;
  display: flex; align-items: center; gap: 56px; padding-inline: 96px 72px; box-sizing: border-box; position: relative; }
body::before { content: ''; position: absolute; left: 252px; top: 315px; width: 1100px; height: 1100px; translate: -50% -50%;
  background: radial-gradient(closest-side, rgb(56 182 255 / 0.2) 0%, rgb(20 50 90 / 0.4) 32%, rgb(14 34 64 / 0.2) 58%, transparent 78%); }
svg { width: 312px; height: 312px; flex: none; position: relative; }
div { position: relative; }
h1 { font-size: 84px; font-weight: 300; line-height: 1.05; letter-spacing: -0.03em; }
p { margin-top: 28px; font-size: 34px; font-weight: 500; color: #8FD4FF; }
</style></head><body>${mark}<div><h1>Elite Digital<br>Dynamics</h1><p>Your Vision, Our Innovation</p></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.route('**/*', (route) => route.abort());
await page.setContent(html);
const loaded = await page.evaluate(async () => {
  await document.fonts.ready;
  return [...document.fonts].map((f) => `${f.family}:${f.status}`);
});
if (!loaded.includes('Manrope:loaded')) throw new Error(`Manrope did not load: ${loaded}`);
const shot = await page.screenshot();
await browser.close();
// A 256-colour PNG: a fifth of the size, and still a PNG, which every share preview accepts.
await sharp(shot)
  .png({ palette: true, quality: 92, effort: 10, colours: 256, dither: 1 })
  .toFile(new URL('src/app/opengraph-image.png', root).pathname);

await writeFile(
  new URL('src/app/opengraph-image.alt.txt', root),
  'Elite Digital Dynamics: two blue rings around a glowing pink core. Your Vision, Our Innovation.',
);
console.log('src/app/opengraph-image.png', loaded);

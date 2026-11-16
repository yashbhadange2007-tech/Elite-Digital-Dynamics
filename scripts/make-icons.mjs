// Renders the owner's app icon (public/brand/edd-app-icon.svg) to the PNG icons the site needs.
// The favicon is the owner's SVG copied as is (src/app/icon.svg); nothing here redraws artwork.
// Run: node scripts/make-icons.mjs
import { copyFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const appIcon = new URL('public/brand/edd-app-icon.svg', root);

await copyFile(new URL('public/brand/edd-favicon.svg', root), new URL('src/app/icon.svg', root));
await mkdir(new URL('public/icons/', root), { recursive: true });

for (const [size, out] of [
  [180, 'src/app/apple-icon.png'],
  [192, 'public/icons/icon-192.png'],
  [512, 'public/icons/icon-512.png'],
]) {
  // The SVG is 512 units wide: render it at the target size directly, so edges stay crisp.
  await sharp(appIcon.pathname, { density: (72 * size) / 512 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(new URL(out, root).pathname);
  console.log(out, `${size}x${size}`);
}

import localFont from 'next/font/local';

/**
 * Self-hosted variable fonts (files and licence in src/fonts). Never next/font/google: it fetches
 * at build time and the brief forbids any dependency on a public CDN.
 * next/font needs literal option values, so the fallback list is written out twice.
 */

/**
 * Manrope, weight 200 to 800: the site typeface. `manrope.variable` is set on `<html>` in the root
 * layout and defines `--font-sans`, which Tailwind's `font-sans` and the base styles use.
 */
export const manrope = localFont({
  src: '../fonts/Manrope-Variable.woff2',
  variable: '--font-sans',
  weight: '200 800',
  style: 'normal',
  display: 'swap',
  preload: true,
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
});

/**
 * Figtree, weight 300 to 900: only inside the SocialSync demo. Not preloaded. Put
 * `figtree.variable` on the demo root, then use `font-family: var(--font-figtree)` inside it.
 */
export const figtree = localFont({
  src: '../fonts/Figtree-Variable.woff2',
  variable: '--font-figtree',
  weight: '300 900',
  style: 'normal',
  display: 'swap',
  preload: false,
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
});

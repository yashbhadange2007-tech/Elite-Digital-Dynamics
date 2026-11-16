import data from './sites.data.json';

/** Which device frame a preview is in. Virtual widths: phone 390, laptop 1280. */
export type Device = 'phone' | 'laptop';

/**
 * `tall`: whole page in one tall iframe inside our scroller (needs a page whose height does not
 * follow the iframe height). `interactive`: normal-height iframe the visitor scrolls. `screenshot`:
 * full-page screenshot tiles in our scroller, no iframe.
 */
export type Mode = 'tall' | 'interactive' | 'screenshot';

/** One WebP tile of a full-page screenshot (`scripts/capture-sites.mjs`); size in image pixels. */
export type Shot = { src: string; width: number; height: number };

export type Site = {
  /** `/visit/<slug>` redirects to `url` (next.config.ts). */
  slug: string;
  url: string;
  name: string;
  /** Shown in the frame's address bar: the business name, never a URL. */
  addressLabel: string;
  caption: string;
  mode: Record<Device, Mode>;
  /** Document height in CSS px at the device's virtual width (docs/research/sites.md). */
  height: Record<Device, number>;
  footerColor: string;
  shots: Record<Device, Shot[]>;
};

export const SITES = data as Site[];

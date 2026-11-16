import type { PoseId } from '@/lib/scroll-store';

/**
 * The seven arrangements of the object, one per pose anchor (SPEC.md section 5). Data only.
 *
 * Where the object sits: `x` and `y` are the centre as fractions of the viewport (0, 0 is top
 * left), `size` is ring A's radius as a fraction of the viewport's shorter side. `a` and `b`
 * optionally move a ring away from the core, in units of ring A's radius (x right, y up).
 * `below` keeps the top of the object at least this many px from the top of the screen, however
 * short the screen is (the hero's text and buttons on phones end about 490px down).
 * `maxR` caps ring A's radius in px, so a small pose stays small on a tablet.
 * `short` applies on screens under SHORT_MAX px tall: it replaces `y`, scales the size, and `below`
 * is ignored (on a 640px screen `below` would push the object almost off the bottom).
 */
export type Place = {
  x: number;
  y: number;
  size: number;
  a?: [number, number];
  b?: [number, number];
  below?: number;
  maxR?: number;
  short?: { y: number; scale: number };
};

/** Screens shorter than this many px use a place's `short` values. */
export const SHORT_MAX = 700;

/** How far the tilted object reaches above its centre, in units of ring A's radius (used by `below`). */
export const REACH_UP = 0.85;

export type Pose = {
  id: PoseId;
  /** Below 1024px wide, where the page's sections stack (text on top, object below). */
  phone: Place;
  desktop: Place;
  /** 0 = full brightness, 1 = fully dimmed (the object sits behind panels). */
  dim: number;
  /** Frame rate cap: 30 where the object is small and calm. */
  fps: 30 | 60;
  /** Orientation of ring A and ring B: degrees about x, y, z. 0, 0, 0 faces the viewer as in the logo. */
  tiltA: [number, number, number];
  tiltB: [number, number, number];
  /** In-plane turning speed of A and B in radians per second (opposite signs; 0 = settle to the logo). */
  spin: [number, number];
  /** Amplitude of the idle sway, radians. */
  sway: number;
};

export const POSES: readonly Pose[] = [
  {
    // Skewed gyroscope. Desktop: right, large, its outer ring passing behind the end of the
    // headline. Phone: lower half, bleeding off the right; on short phones higher and smaller, so
    // the core still shows under the buttons.
    id: 'hero',
    phone: { x: 0.68, y: 0.79, size: 0.42, below: 500, short: { y: 0.82, scale: 0.8 } },
    desktop: { x: 0.69, y: 0.54, size: 0.37 },
    dim: 0,
    fps: 60,
    tiltA: [-52, 28, 0],
    tiltB: [46, -30, 0],
    spin: [0.22, -0.34],
    sway: 0.09,
  },
  {
    // Flat and concentric, facing the viewer, cropped by the screen edge, behind the panel.
    id: 'services',
    phone: { x: 0.5, y: 0.74, size: 0.56 },
    desktop: { x: 0.03, y: 0.56, size: 0.44 },
    dim: 0.55,
    fps: 60,
    tiltA: [0, 0, 0],
    tiltB: [0, 0, 0],
    spin: [0.18, -0.28],
    sway: 0.05,
  },
  {
    // Upright arcs rising from below, behind the previews.
    id: 'work',
    phone: { x: 0.5, y: 1.0, size: 0.6 },
    desktop: { x: 0.5, y: 1.0, size: 0.46 },
    dim: 0.6,
    fps: 60,
    tiltA: [0, 38, 0],
    tiltB: [0, -52, 0],
    spin: [0.16, -0.24],
    sway: 0.05,
  },
  {
    // Small and calm in the top right corner (the same size on a tablet as on a phone).
    id: 'demo',
    phone: { x: 0.86, y: 0.13, size: 0.13, maxR: 50 },
    desktop: { x: 0.92, y: 0.17, size: 0.085 },
    dim: 0.75,
    fps: 30,
    tiltA: [-36, 22, 0],
    tiltB: [30, -26, 0],
    spin: [0.12, -0.18],
    sway: 0.04,
  },
  {
    // The object comes apart along one line: ring A, core, ring B.
    id: 'process',
    // Phone: down the left edge, the core half off screen so no step text sits on it.
    // Desktop: a row behind the steps, centred on the rail (the steps' list sits about 56px below
    // the section's centre, which is the screen's centre at rest).
    phone: { x: 0, y: 0.5, size: 0.19, a: [0, 2.5], b: [0, -2.1] },
    desktop: { x: 0.5, y: 0.56, size: 0.12, a: [-2.7, 0], b: [2.3, 0] },
    dim: 0.6,
    fps: 60,
    tiltA: [-18, 14, 0],
    tiltB: [16, -12, 0],
    spin: [0.2, -0.3],
    sway: 0.06,
  },
  {
    // Small gyroscope to one side.
    id: 'faq',
    // Phone: in the corner, right of the heading's line.
    phone: { x: 0.95, y: 0.13, size: 0.17 },
    desktop: { x: 0.97, y: 0.5, size: 0.2 },
    dim: 0.65,
    fps: 60,
    tiltA: [-48, -26, 0],
    tiltB: [40, 30, 0],
    spin: [0.2, -0.3],
    sway: 0.07,
  },
  {
    // The logo, exactly. The solver puts it on the logo stage; this place is used only when the
    // page has no stage.
    id: 'contact',
    phone: { x: 0.5, y: 0.4, size: 0.2 },
    desktop: { x: 0.5, y: 0.45, size: 0.12 },
    dim: 0.1,
    fps: 60,
    tiltA: [0, 0, 0],
    tiltB: [0, 0, 0],
    spin: [0, 0],
    sway: 0,
  },
];

/**
 * Scroll state shared by the scene and anything else that follows scroll. No React state:
 * `scrollState` is one mutable object, rewritten at most once per animation frame.
 *
 * Anchors are the elements with a `data-pose` attribute (the `Section` primitive emits it).
 * `poseIndex` is the position of the viewport centre between the centres of consecutive anchors,
 * expressed as a float index into POSE_ORDER. On the home page (all seven poses, in order) that
 * is 0 at the hero and 6 at the contact section.
 */

export type PoseId = 'hero' | 'services' | 'work' | 'demo' | 'process' | 'faq' | 'contact';

export const POSE_ORDER: readonly PoseId[] = [
  'hero',
  'services',
  'work',
  'demo',
  'process',
  'faq',
  'contact',
];

export type ScrollState = {
  /** `window.scrollY` in px. */
  y: number;
  /** 0 at the top of the page, 1 at the bottom (0 when the page cannot scroll). */
  progress: number;
  /** Float index into POSE_ORDER. Stays 0 on pages without anchors. */
  poseIndex: number;
  /** `window.innerHeight` in px. */
  vh: number;
};

export const scrollState: ScrollState = { y: 0, progress: 0, poseIndex: 0, vh: 0 };

/**
 * Piecewise-linear position of `viewportCentreY` between consecutive anchor centres.
 * Returns a float in [0, n - 1]: i when the viewport centre is on anchor i, i + 0.5 when it is
 * halfway to anchor i + 1. Clamped before the first and after the last anchor.
 * `anchorCentres` must be in ascending order (document order). 0 or 1 anchors give 0.
 */
export function computePoseIndex(viewportCentreY: number, anchorCentres: readonly number[]): number {
  const last = anchorCentres.length - 1;
  if (last < 1 || !(viewportCentreY > anchorCentres[0])) return 0;
  if (viewportCentreY >= anchorCentres[last]) return last;
  for (let i = 0; i < last; i++) {
    const from = anchorCentres[i];
    const to = anchorCentres[i + 1];
    if (viewportCentreY < to) {
      // from <= centre < to, so `to - from` is positive: no division by zero.
      return i + (viewportCentreY - from) / (to - from);
    }
  }
  return last;
}

/**
 * Converts a float anchor index into a float POSE_ORDER index, given the POSE_ORDER index of each
 * anchor. With the full home page this is the identity; with a subset of sections (preview routes)
 * the value still names the right poses.
 */
export function toPoseOrderIndex(anchorIndex: number, anchorPoseIndices: readonly number[]): number {
  const last = anchorPoseIndices.length - 1;
  if (last < 0) return 0;
  const i = Math.min(Math.max(Math.floor(anchorIndex), 0), last);
  const next = Math.min(i + 1, last);
  const t = Math.min(Math.max(anchorIndex - i, 0), 1);
  return anchorPoseIndices[i] + (anchorPoseIndices[next] - anchorPoseIndices[i]) * t;
}

type Listener = () => void;
const listeners = new Set<Listener>();

/**
 * Calls `listener` after `scrollState` changed, at most once per animation frame.
 * Works with `useSyncExternalStore`, e.g. `() => scrollState.y > 24`.
 */
export function subscribeScroll(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let started = false;
let frame = 0;
let needsMeasure = false;
let anchorCentres: number[] = [];
let anchorPoseIndices: number[] = [];
let observer: ResizeObserver | null = null;
const observed = new Set<Element>();

/** Reads anchor positions. Layout read: only called inside an animation frame. */
function measure(): void {
  const scrollY = window.scrollY;
  const found = new Set<Element>();
  const entries: { centre: number; pose: number }[] = [];

  for (const el of document.querySelectorAll<HTMLElement>('[data-pose]')) {
    const pose = POSE_ORDER.indexOf(el.dataset.pose as PoseId);
    if (pose < 0) continue;
    found.add(el);
    const rect = el.getBoundingClientRect();
    // Centre of the anchor's first screen, not of the whole element: a tall section's pose is then
    // in place by the time its heading reaches the top, instead of rings crossing the heading.
    entries.push({ centre: rect.top + scrollY + Math.min(rect.height, innerHeight) / 2, pose });
  }

  entries.sort((a, b) => a.centre - b.centre);
  anchorCentres = entries.map((entry) => entry.centre);
  anchorPoseIndices = entries.map((entry) => entry.pose);

  // Keep the observer on exactly the anchors that are in the document now.
  if (observer) {
    for (const el of observed) {
      if (!found.has(el)) {
        observer.unobserve(el);
        observed.delete(el);
      }
    }
    for (const el of found) {
      if (!observed.has(el)) {
        observer.observe(el);
        observed.add(el);
      }
    }
  }
}

function update(): void {
  frame = 0;
  if (needsMeasure) {
    needsMeasure = false;
    measure();
  }

  const y = window.scrollY;
  const vh = window.innerHeight;
  const range = document.documentElement.scrollHeight - vh;
  const progress = range > 0 ? Math.min(Math.max(y / range, 0), 1) : 0;
  const poseIndex = toPoseOrderIndex(computePoseIndex(y + vh / 2, anchorCentres), anchorPoseIndices);

  if (
    y === scrollState.y &&
    vh === scrollState.vh &&
    progress === scrollState.progress &&
    poseIndex === scrollState.poseIndex
  ) {
    return;
  }
  scrollState.y = y;
  scrollState.vh = vh;
  scrollState.progress = progress;
  scrollState.poseIndex = poseIndex;
  for (const listener of listeners) listener();
}

function schedule(remeasure: boolean): void {
  if (remeasure) needsMeasure = true;
  if (!frame) frame = requestAnimationFrame(update);
}

/**
 * Starts tracking. Safe to call more than once; later calls only ask for a fresh measurement.
 * One passive scroll listener; anchors are re-measured when they or the page change size, when the
 * window resizes and when fonts finish loading.
 */
export function startScrollTracking(): void {
  if (typeof window === 'undefined') return;
  if (started) {
    schedule(true);
    return;
  }
  started = true;

  // Debug hook, like `window.__scene`: lets tests and a phone's console read the live state.
  (window as Window & { __scroll?: ScrollState }).__scroll = scrollState;

  const onScroll = () => schedule(false);
  const onLayoutChange = () => schedule(true);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onLayoutChange, { passive: true });

  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(onLayoutChange);
    // The body catches every change of page height, including route changes.
    observer.observe(document.body);
  }
  document.fonts?.ready.then(onLayoutChange).catch(() => {});

  schedule(true);
}

/**
 * Rendering quality shared by the scene, the glass panels and anything that animates.
 * A tiny external store: read it with `useQuality()` (src/lib/hooks.ts) or `getQuality()`.
 *
 *   tier    0..3, driven by the scene's quality controller. 0 means the render loop is stopped
 *           (also the value before the scene has started).
 *   glass   'lite' (opaque fill, no blur, the default) or 'real' (backdrop blur on primary panels).
 *           Mirrored to `<html data-glass>`.
 *   motion  'full' or 'still' (reduced motion or the visitor paused it).
 *           Mirrored to `<html data-motion>`.
 */

export type Tier = 0 | 1 | 2 | 3;
export type GlassMode = 'lite' | 'real';
export type MotionMode = 'full' | 'still';
export type Quality = { readonly tier: Tier; readonly glass: GlassMode; readonly motion: MotionMode };

/** localStorage key. Holds 'still' or 'full', only while the visitor's choice differs from the OS setting. */
export const MOTION_STORAGE_KEY = 'edd-motion';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** What the server renders: `<html data-glass="lite" data-motion="full">`. */
const SERVER_QUALITY: Quality = Object.freeze({ tier: 0, glass: 'lite', motion: 'full' });

let state: Quality = SERVER_QUALITY;
const listeners = new Set<() => void>();

export function getQuality(): Quality {
  return state;
}

/** Snapshot for server rendering and hydration (`useSyncExternalStore`'s third argument). */
export function getServerQuality(): Quality {
  return SERVER_QUALITY;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function syncDom(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (root.getAttribute('data-glass') !== state.glass) root.setAttribute('data-glass', state.glass);
  if (root.getAttribute('data-motion') !== state.motion) root.setAttribute('data-motion', state.motion);
}

function set(patch: Partial<Quality>): void {
  const next = { ...state, ...patch };
  const changed = next.tier !== state.tier || next.glass !== state.glass || next.motion !== state.motion;
  if (changed) state = Object.freeze(next);
  syncDom();
  if (changed) for (const listener of listeners) listener();
}

export function setTier(tier: Tier): void {
  set({ tier });
}

export function setGlass(glass: GlassMode): void {
  set({ glass });
}

/** Sets the motion mode without saving it. `toggleMotion()` is the visitor-facing action. */
export function setMotion(motion: MotionMode): void {
  set({ motion });
}

function osMotion(): MotionMode {
  return typeof window !== 'undefined' && window.matchMedia?.(REDUCED_MOTION_QUERY).matches
    ? 'still'
    : 'full';
}

function readStored(): MotionMode | null {
  try {
    const value = window.localStorage.getItem(MOTION_STORAGE_KEY);
    return value === 'still' || value === 'full' ? value : null;
  } catch {
    return null; // storage blocked: fall back to the OS setting
  }
}

function writeStored(value: MotionMode | null): void {
  try {
    if (value) window.localStorage.setItem(MOTION_STORAGE_KEY, value);
    else window.localStorage.removeItem(MOTION_STORAGE_KEY);
  } catch {
    // storage blocked: the choice lasts for this page view only
  }
}

let listening = false;

/**
 * Applies the visitor's motion preference: the saved choice if there is one, otherwise the OS
 * `prefers-reduced-motion` setting. Then follows later changes of the OS setting.
 * Safe to call again: it re-applies both root attributes (React resets them on a dev remount).
 */
export function initMotionPreference(): void {
  if (typeof window === 'undefined') return;
  set({ motion: readStored() ?? osMotion() });

  if (listening) return;
  listening = true;
  window.matchMedia?.(REDUCED_MOTION_QUERY).addEventListener('change', () => {
    // The OS setting changed during the visit: it is the newest instruction, so it wins.
    writeStored(null);
    set({ motion: osMotion() });
  });
}

/** Pauses or resumes motion and remembers the choice (WCAG 2.2.2). */
export function toggleMotion(): void {
  const next: MotionMode = state.motion === 'full' ? 'still' : 'full';
  // Store only a choice that differs from the OS setting, so a later change of that setting is respected.
  writeStored(next === osMotion() ? null : next);
  set({ motion: next });
}

/**
 * Inline script for `<head>`. Sets `data-motion` before first paint with the same rule as
 * `initMotionPreference()`, so a paused or reduced-motion visitor never sees a moving first frame.
 */
export const MOTION_BOOT_SCRIPT = `(function(){var s=null;try{s=localStorage.getItem(${JSON.stringify(
  MOTION_STORAGE_KEY,
)})}catch(e){}var m=s==='still'||s==='full'?s:window.matchMedia&&matchMedia(${JSON.stringify(
  REDUCED_MOTION_QUERY,
)}).matches?'still':'full';document.documentElement.setAttribute('data-motion',m)})()`;

/**
 * Rendering settings shared by the sculpture, the glass panels and anything that animates.
 * A tiny external store: read it with `useQuality()` (src/lib/hooks.ts) or `getQuality()`.
 *
 *   glass   'lite' (translucent fill, no blur, the default) or 'real' (backdrop blur on primary
 *           panels). Decided once by `initGlass()`. Mirrored to `<html data-glass>`.
 *   motion  'full' or 'still' (reduced motion or the visitor paused it).
 *           Mirrored to `<html data-motion>`.
 */

export type GlassMode = 'lite' | 'real';
export type MotionMode = 'full' | 'still';
export type Quality = { readonly glass: GlassMode; readonly motion: MotionMode };

/** localStorage key. Holds 'still' or 'full', only while the visitor's choice differs from the OS setting. */
export const MOTION_STORAGE_KEY = 'edd-motion';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** What the server renders: `<html data-glass="lite" data-motion="full">`. */
const SERVER_QUALITY: Quality = Object.freeze({ glass: 'lite', motion: 'full' });

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
  const changed = next.glass !== state.glass || next.motion !== state.motion;
  if (changed) state = Object.freeze(next);
  syncDom();
  if (changed) for (const listener of listeners) listener();
}

export function setGlass(glass: GlassMode): void {
  set({ glass });
}

/**
 * Real glass only where a blur is cheap: a wide screen with a mouse, and a browser that supports
 * `backdrop-filter`. Phones and tablets keep the lite fill, because a blur over the playing
 * sculpture clip costs frames there (DESIGN.md 6).
 */
export function initGlass(): void {
  if (typeof window === 'undefined') return;
  const roomy = window.matchMedia?.('(min-width: 64rem) and (hover: hover) and (pointer: fine)').matches;
  const blurs =
    typeof CSS !== 'undefined' &&
    (CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)'));
  set({ glass: roomy && blurs ? 'real' : 'lite' });
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

/** sessionStorage key: set once the intro has been shown in this browser session. */
export const INTRO_STORAGE_KEY = 'edd-intro';

/**
 * Inline script for `<head>`. Two jobs, both before first paint:
 *
 * 1. Sets `data-motion` with the same rule as `initMotionPreference()`, so a paused or
 *    reduced-motion visitor never sees a moving first frame.
 * 2. Starts the intro (`data-intro="play"`, styled in globals.css) once per browser session and
 *    only when motion is allowed. The first tap, key, wheel or scroll ends it at once; a timer
 *    ends it after the 1.5 s animation. If session storage is blocked there is no intro.
 */
export const MOTION_BOOT_SCRIPT = `(function(){var d=document.documentElement,s=null;try{s=localStorage.getItem(${JSON.stringify(
  MOTION_STORAGE_KEY,
)})}catch(e){}var m=s==='still'||s==='full'?s:window.matchMedia&&matchMedia(${JSON.stringify(
  REDUCED_MOTION_QUERY,
)}).matches?'still':'full';d.setAttribute('data-motion',m);try{if(m==='full'&&!sessionStorage.getItem(${JSON.stringify(
  INTRO_STORAGE_KEY,
)})){sessionStorage.setItem(${JSON.stringify(
  INTRO_STORAGE_KEY,
)},'1');d.setAttribute('data-intro','play');var v=['pointerdown','keydown','wheel','touchstart','scroll'],o={capture:true,passive:true},x=function(){d.removeAttribute('data-intro');v.forEach(function(n){removeEventListener(n,x,o)})};v.forEach(function(n){addEventListener(n,x,o)});setTimeout(x,1600)}}catch(e){}})()`;

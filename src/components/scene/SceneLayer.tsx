'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useQuality } from '@/lib/hooks';
import { getQuality, setMotion } from '@/lib/quality-store';
import { POSE_ORDER, type PoseId } from '@/lib/scroll-store';
import type { SolverOutput } from './solver';

/**
 * The scene layer: the logo in 3D behind the page. Default export, mounted by src/app/page.tsx.
 *
 * Nothing 3D is in the first load. After first paint and an idle moment this component decides:
 *   live    WebGL works and motion is on: the animated canvas, fixed behind the page.
 *   still   reduced motion or Pause: one frame of the hero pose, a picture that scrolls away with the hero.
 *   poster  no WebGL, a slow software renderer, Save-Data, a lost context or a scene that cannot keep
 *           up: a static image of the hero pose. three.js is never requested.
 * The decision is written to <html data-scene>, which the logo stage and the tests read.
 *
 * URL switches (debugging on a real phone, tests, the preview route):
 *   ?scene=force  accept a software renderer      ?hud=1     show the frame-time overlay
 *   ?pose=<id>    hold one pose                   ?tier=<n>  hold one quality tier (1 to 3)
 *   ?still=1      start paused
 */

type SceneState = 'live' | 'still' | 'poster';

/** `window.__scene`: what the scene is doing, for tests and the overlay. */
export type SceneDebug = {
  /** True once the first frame is on screen. */
  ready: boolean;
  /** Frames rendered so far. */
  frames: number;
  tier: number;
  dpr: number;
  /** Damped pose index. */
  poseIndex: number;
  state: SceneState | null;
  /** Draw calls and triangles of the last frame. */
  info: { calls: number; triangles: number };
  /** The solver's last output (position, size, ring orientations). */
  solved: SolverOutput | null;
  /** Median and 95th percentile frame time of the last measured window, ms. */
  median: number;
  p95: number;
  /** Script time of the scene's last frame callback, ms. */
  callbackMs: number;
};

const debug: SceneDebug = {
  ready: false,
  frames: 0,
  tier: 0,
  dpr: 0,
  poseIndex: 0,
  state: null,
  info: { calls: 0, triangles: 0 },
  solved: null,
  median: 0,
  p95: 0,
  callbackMs: 0,
};

const SceneCanvas = dynamic(() => import('./SceneCanvas'), { ssr: false });

type Decision = { webgl: boolean; lockPose: number | null; lockTier: 1 | 2 | 3 | null; hud: boolean };

/** Runs in the browser, once. Probes WebGL without loading three.js. */
function decide(): Decision {
  const params = new URLSearchParams(window.location.search);
  const pose = POSE_ORDER.indexOf(params.get('pose') as PoseId);
  const tier = Number(params.get('tier'));
  if (params.get('still') === '1') setMotion('still');

  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  let webgl = false;
  if (!saveData) {
    // A software renderer counts as "no WebGL" unless forced: it cannot hold the frame rate.
    const context = document
      .createElement('canvas')
      .getContext('webgl2', { failIfMajorPerformanceCaveat: params.get('scene') !== 'force' });
    webgl = context !== null;
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  }
  return {
    webgl,
    lockPose: pose >= 0 ? pose : null,
    lockTier: tier === 1 || tier === 2 || tier === 3 ? tier : null,
    hud: params.get('hud') === '1',
  };
}

export default function SceneLayer() {
  const motion = useQuality().motion;
  const [decision, setDecision] = useState<Decision | null>(null);
  const [gaveUp, setGaveUp] = useState(false);
  const [shown, setShown] = useState(false);
  const hud = useRef<HTMLPreElement>(null);

  const state: SceneState | null = !decision
    ? null
    : !decision.webgl || gaveUp
      ? 'poster'
      : motion === 'still'
        ? 'still'
        : 'live';

  // Decide after first paint, when the browser is idle (Safari has no requestIdleCallback).
  useEffect(() => {
    let idle = 0;
    let timer = 0;
    const run = () => setDecision(decide());
    const frame = requestAnimationFrame(() => {
      if (window.requestIdleCallback) idle = window.requestIdleCallback(run, { timeout: 2000 });
      else timer = window.setTimeout(run, 200);
    });
    return () => {
      cancelAnimationFrame(frame);
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    (window as Window & { __scene?: SceneDebug }).__scene = debug;
    debug.state = state;
    if (!state) return;
    document.documentElement.dataset.scene = state;
    return () => {
      delete document.documentElement.dataset.scene;
    };
  }, [state]);

  const showHud = decision?.hud;
  useEffect(() => {
    if (!showHud) return;
    const timer = window.setInterval(() => {
      if (!hud.current) return;
      hud.current.textContent =
        `scene ${debug.state}, glass ${getQuality().glass}\n` +
        `tier ${debug.tier}, dpr ${debug.dpr}\n` +
        `median ${debug.median.toFixed(1)} ms, p95 ${debug.p95.toFixed(1)} ms`;
    }, 500);
    return () => window.clearInterval(timer);
  }, [showHud]);

  const onReady = useCallback(() => setShown(true), []);
  const onGiveUp = useCallback(() => setGaveUp(true), []);

  return (
    <>
      <div
        aria-hidden="true"
        data-scene-layer
        className={cn(
          'pointer-events-none top-0 left-0 z-(--z-scene) h-lvh w-full contain-strict',
          // Live: a fixed background. Still or poster: a picture in the hero that scrolls away.
          state === 'still' || state === 'poster' ? 'absolute' : 'fixed',
        )}
      >
        {state === 'poster' ? (
          <picture>
            <source media="(min-width: 48rem)" srcSet="/scene/poster-desktop.webp" />
            <img
              src="/scene/poster-mobile.webp"
              alt=""
              decoding="async"
              className="size-full object-cover object-bottom-right md:object-right"
            />
          </picture>
        ) : decision && state ? (
          <div className={cn('size-full opacity-0 transition-opacity duration-(--dur-3)', shown && 'opacity-100')}>
            <SceneCanvas
              lockPose={decision.lockPose}
              lockTier={decision.lockTier}
              still={state === 'still'}
              debug={debug}
              onReady={onReady}
              onGiveUp={onGiveUp}
            />
          </div>
        ) : null}
      </div>
      {showHud ? (
        <pre
          ref={hud}
          className="pointer-events-none fixed bottom-2 left-2 z-(--z-skip) rounded-card bg-bg/80 px-2 py-1.5 font-mono text-[12px] leading-snug text-text"
        />
      ) : null}
    </>
  );
}

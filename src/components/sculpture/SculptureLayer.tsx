'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useMediaQuery, useQuality } from '@/lib/hooks';
import { scrollState, subscribeScroll } from '@/lib/scroll-store';
import {
  DESKTOP_POSES,
  FRAME_COUNT,
  PHONE_POSES,
  damp,
  frameAt,
  loadOrder,
  poseAt,
  type Pose,
} from './poses';

/**
 * The sculpture: one layer behind the page (DESIGN.md 9). It replaces the old WebGL scene.
 *
 *   still    the poster only, placed for the hero and scrolling away with it. This is what the
 *            server renders, and what stays under reduced motion, a paused page, Save-Data or
 *            refused autoplay.
 *   desktop  (min-width: 64rem) 190 frames on a canvas. Scroll picks the frame; a slow drift keeps
 *            it alive. Frames load after first paint, a coarse pass first.
 *   phone    a muted, inline, looping clip. Scroll never scrubs it (that stutters on phones);
 *            scroll only moves, scales and fades the layer.
 *
 * In the two live modes the layer is fixed and eases between the per-section poses with
 * `transform` and `opacity` only. Nothing here touches React state per frame.
 */

type Mode = 'still' | 'desktop' | 'phone';

const WIDE = '(min-width: 64rem)';
const frameSrc = (index: number) => `/sculpture/d/${String(index).padStart(3, '0')}.webp`;
const noop = () => () => {};

/** For the browser tests: what the layer is doing right now. */
type Probe = { mode: Mode; frame: number; loaded: number };
const report = (probe: Probe) => {
  (window as unknown as { __sculpture?: Probe }).__sculpture = probe;
};

function applyPose(stage: HTMLElement, pose: Pose): void {
  stage.style.transform = `translate3d(${pose.x.toFixed(3)}vw, ${pose.y.toFixed(3)}lvh, 0) scale(${pose.scale.toFixed(4)})`;
  stage.style.opacity = pose.opacity.toFixed(3);
}

function dampPose(pose: Pose, target: Pose, dt: number): Pose {
  return {
    x: damp(pose.x, target.x, 5, dt),
    y: damp(pose.y, target.y, 5, dt),
    scale: damp(pose.scale, target.scale, 5, dt),
    opacity: damp(pose.opacity, target.opacity, 6, dt),
  };
}

const settled = (a: Pose, b: Pose) =>
  Math.abs(a.x - b.x) < 0.01 &&
  Math.abs(a.y - b.y) < 0.01 &&
  Math.abs(a.scale - b.scale) < 0.0005 &&
  Math.abs(a.opacity - b.opacity) < 0.002;

export default function SculptureLayer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const wide = useMediaQuery(WIDE);
  const { motion } = useQuality();
  const [refused, setRefused] = useState(false); // the browser would not autoplay (low-power mode)

  const saveData =
    mounted && (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const mode: Mode =
    !mounted || motion === 'still' || saveData ? 'still' : wide ? 'desktop' : refused ? 'still' : 'phone';

  useEffect(() => {
    if (mode === 'still') report({ mode, frame: 0, loaded: 0 });
  }, [mode]);

  // Desktop: scroll turns the rings.
  useEffect(() => {
    if (mode !== 'desktop') return;
    const root = rootRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false });
    if (!root || !stage || !canvas || !context) return;

    const frames: (HTMLImageElement | undefined)[] = new Array(FRAME_COUNT);
    const queue = loadOrder();
    let loaded = 0;
    let dirty = false;
    let stopped = false;

    const loadNext = () => {
      const index = queue.shift();
      if (stopped || index === undefined) return;
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        frames[index] = image;
        loaded += 1;
        dirty = true;
        loadNext();
      };
      image.onerror = loadNext;
      image.src = frameSrc(index);
    };
    // After first paint and out of the way of the page's own work; six downloads at a time.
    const begin = () => {
      for (let i = 0; i < 6; i++) loadNext();
    };
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(begin, { timeout: 1500 })
      : window.setTimeout(begin, 300);

    /** The nearest loaded frame from `from`, looking in `direction`. */
    const nearest = (from: number, direction: 1 | -1) => {
      for (let i = from; i >= 0 && i < FRAME_COUNT; i += direction) if (frames[i]) return i;
      return -1;
    };

    let pose = poseAt(scrollState.poseIndex, DESKTOP_POSES);
    let frame = frameAt(scrollState.progress, 0);
    let drawn = -1;
    let last = performance.now();
    const started = last;
    let raf = 0;
    root.dataset.live = '';

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      const target = poseAt(scrollState.poseIndex, DESKTOP_POSES);
      if (!settled(pose, target)) {
        pose = dampPose(pose, target, dt);
        applyPose(stage, pose);
      }

      frame = damp(frame, frameAt(scrollState.progress, (now - started) / 1000), 7, dt);
      if (loaded === 0 || (!dirty && Math.abs(frame - drawn) < 0.04)) return;

      const below = nearest(Math.floor(frame), -1);
      const above = nearest(Math.min(Math.floor(frame) + 1, FRAME_COUNT - 1), 1);
      const from = below >= 0 ? below : above;
      const to = above >= 0 ? above : below;
      context.globalAlpha = 1;
      context.drawImage(frames[from]!, 0, 0, canvas.width, canvas.height);
      if (to !== from) {
        // In-between positions: cross-fade to the next frame.
        const mix = Math.min(Math.max((frame - from) / (to - from), 0), 1);
        if (mix > 0.02) {
          context.globalAlpha = mix;
          context.drawImage(frames[to]!, 0, 0, canvas.width, canvas.height);
        }
      }
      drawn = frame;
      dirty = false;
      canvas.dataset.ready = '';
      report({ mode: 'desktop', frame, loaded });
    };

    applyPose(stage, pose);
    raf = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
      delete root.dataset.live;
      stage.style.transform = '';
      stage.style.opacity = '';
    };
  }, [mode]);

  // Phone: the clip plays on its own; scroll only eases the layer between poses.
  useEffect(() => {
    if (mode !== 'phone') return;
    const root = rootRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!root || !stage || !video) return;

    video.muted = true; // React does not always write the attribute, and autoplay needs it
    video.play().catch(() => setRefused(true));

    let pose = poseAt(scrollState.poseIndex, PHONE_POSES);
    let last = 0;
    let raf = 0;
    let running = false;
    root.dataset.live = '';
    applyPose(stage, pose);
    report({ mode: 'phone', frame: 0, loaded: 0 });

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
      last = now;
      const target = poseAt(scrollState.poseIndex, PHONE_POSES);
      pose = dampPose(pose, target, dt);
      applyPose(stage, pose);
      if (settled(pose, target)) {
        running = false; // nothing to do until the next scroll
        last = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    wake();
    const unsubscribe = subscribeScroll(wake);

    return () => {
      unsubscribe();
      cancelAnimationFrame(raf);
      delete root.dataset.live;
      stage.style.transform = '';
      stage.style.opacity = '';
    };
  }, [mode]);

  return (
    <div ref={rootRef} className="sculpture" data-sculpture={mode} aria-hidden="true">
      <div ref={stageRef} className="sculpture-stage">
        <picture>
          <source media={WIDE} srcSet="/sculpture/desktop-poster.webp" width={1600} height={900} />
          <img
            className="sculpture-media"
            src="/sculpture/phone-poster.webp"
            width={720}
            height={800}
            alt=""
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        {mode === 'desktop' ? <canvas ref={canvasRef} className="sculpture-media" width={1440} height={810} /> : null}
        {mode === 'phone' ? (
          <video
            ref={videoRef}
            className="sculpture-media"
            src="/sculpture/phone.mp4"
            poster="/sculpture/phone-poster.webp"
            width={720}
            height={800}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            disablePictureInPicture
            tabIndex={-1}
          />
        ) : null}
      </div>
    </div>
  );
}

'use client';

import { Canvas, useFrame, useThree, type RootState } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Group, MathUtils, Mesh, PointLight, SphereGeometry, Sprite } from 'three';
import { getQuality, setGlass, setTier } from '@/lib/quality-store';
import { scrollState } from '@/lib/scroll-store';
import { LOGO, makeRing } from './geometry';
import { CORE_LIGHT, makeCoreMaterial, makeEnvironment, makeHaloMaterial, makeRingMaterial } from './materials';
import { createController, HALF_RATE_GAP, startTier, TIERS } from './quality';
import type { SceneDebug } from './SceneLayer';
import { createSolver } from './solver';

/**
 * The live scene: the canvas, the two rings and the core, and the frame loop. Loaded on demand by
 * SceneLayer, so three.js is never part of the first load.
 */

export type SceneCanvasProps = {
  /** Fixed pose index and tier from the URL (preview and debugging), or null. */
  lockPose: number | null;
  lockTier: 1 | 2 | 3 | null;
  /** One frame of the hero pose, no loop (reduced motion, Pause). */
  still: boolean;
  debug: SceneDebug;
  /** Called once, after the first frame is on screen. */
  onReady: () => void;
  /** Called when the scene should be replaced by the poster (context lost, or too slow). */
  onGiveUp: () => void;
};

/** The engine also gets the setter for the canvas resolution. */
type RigProps = SceneCanvasProps & { setDpr: (dpr: number) => void };

const FOV = 32;
const CAMERA_Z = 10;
/** World units per px in the plane of the object, for a canvas `height` px tall. */
const unitsPerPx = (height: number) => (2 * CAMERA_Z * Math.tan(MathUtils.degToRad(FOV / 2))) / height;

type Materials = {
  ring: ReturnType<typeof makeRingMaterial>;
  core: ReturnType<typeof makeCoreMaterial>;
  halos: ReturnType<typeof makeHaloMaterial>[];
};

/** Rings, core, glow sprites and the core's light in one group, sized so ring A's radius is 1. */
function buildObject(tier: 1 | 2 | 3, materials: Materials) {
  const { around, edge, halos } = TIERS[tier];
  const ringA = new Mesh(makeRing(LOGO.ringA, around, edge), materials.ring);
  const ringB = new Mesh(makeRing(LOGO.ringB, Math.round(around * 0.75), edge), materials.ring);
  // The core keeps its detail at every tier: it is small, and a faceted outline shows at once.
  const core = new Mesh(new SphereGeometry(LOGO.coreRadius, 40, 20), materials.core);
  const light = new PointLight(CORE_LIGHT);
  const group = new Group().add(ringA, ringB, core, light);
  [2 * LOGO.glowRadius, 4.6 * LOGO.glowRadius].slice(0, halos).forEach((diameter, k) => {
    const halo = new Sprite(materials.halos[k]);
    halo.scale.setScalar(diameter);
    group.add(halo);
  });
  const dispose = () => {
    for (const mesh of [ringA, ringB, core]) mesh.geometry.dispose();
  };
  return { group, ringA, ringB, light, dispose };
}

/**
 * Everything imperative lives in this plain function, outside React: it owns the objects, the
 * listeners and the frame loop. `root` is React Three Fiber's state for the canvas.
 */
function createEngine(root: RootState, options: Omit<RigProps, 'still'>) {
  const { gl, scene, invalidate } = root;
  const { lockPose, lockTier, debug, onReady, onGiveUp, setDpr } = options;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const controller = createController({
    tier: lockTier ?? startTier({ coarse: !finePointer, deviceMemory }),
    coarse: !finePointer,
    locked: lockTier !== null,
  });
  const solver = createSolver(lockPose ?? scrollState.poseIndex);
  const materials: Materials = {
    ring: makeRingMaterial(),
    core: makeCoreMaterial(),
    halos: [makeHaloMaterial('#FF3B1F', 0.55), makeHaloMaterial('#C42415', 0.25)],
  };
  scene.environment = makeEnvironment(gl);
  const glow = document.querySelector<HTMLElement>('.page-glow');

  let still = false;
  let announced = false;
  debug.ready = false;
  let tier = controller.tier as 1 | 2 | 3;
  let object: ReturnType<typeof buildObject>;

  // Tier: geometry detail and resolution cap here, the shared store for everyone else.
  const applyTier = () => {
    object = buildObject(tier, materials);
    scene.add(object.group);
    setDpr(Math.min(window.devicePixelRatio, TIERS[tier].dpr));
    setTier(tier);
  };
  const removeObject = () => {
    scene.remove(object.group);
    object.dispose();
  };
  applyTier();
  setGlass(controller.glass);

  // A lost context cannot draw again: hand over to the poster.
  const onLost = (event: Event) => {
    event.preventDefault();
    onGiveUp();
  };
  gl.domElement.addEventListener('webglcontextlost', onLost);

  // Pointer: only where there is a real one.
  let pointer: { x: number; y: number } | null = null;
  const onMove = (event: PointerEvent) => {
    pointer = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: (event.clientY / window.innerHeight) * 2 - 1,
    };
  };
  if (finePointer) window.addEventListener('pointermove', onMove, { passive: true });

  // The logo stage's place in the document, measured when the page changes size, never per frame.
  let stage: { x: number; y: number; size: number } | null = null;
  let measureFrame = 0;
  const measure = () => {
    measureFrame = 0;
    const rect = document.querySelector('[data-logo-stage]')?.getBoundingClientRect();
    stage = rect
      ? { x: rect.left + window.scrollX + rect.width / 2, y: rect.top + window.scrollY + rect.height / 2, size: rect.width }
      : null;
  };
  const scheduleMeasure = () => {
    measureFrame ||= requestAnimationFrame(measure);
  };
  const observer = new ResizeObserver(scheduleMeasure);
  observer.observe(document.body);
  window.addEventListener('resize', scheduleMeasure, { passive: true });
  document.fonts.ready.then(scheduleMeasure);

  /** Runs before every rendered frame: solve, then move the objects, the glow and the dim. */
  const update = (delta: number) => {
    const started = performance.now();
    const { width, height } = root.get().size;
    const out = solver.step({
      dt: still ? 0 : delta,
      poseIndex: still ? 0 : (lockPose ?? scrollState.poseIndex),
      snap: still,
      pointer,
      viewport: { w: width, h: height },
      // window.scrollY, not scrollState.y: the store updates later in the frame, and one frame of
      // lag would let the logo slide on its stage while the page scrolls.
      stage: stage && { x: stage.x - window.scrollX, y: stage.y - window.scrollY, size: stage.size },
    });

    const unit = unitsPerPx(height);
    const scale = out.r * unit;
    object.group.position.set((out.x - width / 2) * unit, (height / 2 - out.y) * unit, 0);
    object.group.scale.setScalar(scale);
    object.group.rotation.set(out.tiltX, out.tiltY, 0);
    object.ringA.position.set(out.a.x, out.a.y, 0);
    object.ringA.quaternion.copy(out.a.q);
    object.ringB.position.set(out.b.x, out.b.y, 0);
    object.ringB.quaternion.copy(out.b.q);
    object.light.intensity = 5 * scale * scale; // same look at every size

    // Dim: the object and the glow fade together behind panels. The glow follows the object
    // only while the scene is live; in the still frame it keeps its CSS place.
    const opacity = (1 - 0.6 * out.dim).toFixed(3);
    gl.domElement.style.opacity = opacity;
    if (glow && !still) {
      glow.style.transform = `translate3d(${out.x.toFixed(1)}px, ${out.y.toFixed(1)}px, 0)`;
      glow.style.opacity = opacity;
    }

    debug.frames++;
    debug.tier = tier;
    debug.dpr = gl.getPixelRatio();
    debug.poseIndex = out.p;
    debug.solved = out;
    debug.info = gl.info.render;
    debug.median = controller.median;
    debug.p95 = controller.p95;
    debug.callbackMs = performance.now() - started;
    if (!announced) {
      announced = true;
      requestAnimationFrame(() => {
        debug.ready = true;
        onReady();
      });
    }
  };

  // Our own loop. It asks for a frame only while the tab is visible and motion is on, and for
  // every other one at half rate. Each tick also feeds the quality controller.
  let loopFrame = 0;
  let last = 0;
  let lastRender = 0;
  const tick = (now: number) => {
    loopFrame = requestAnimationFrame(tick);
    if (last) {
      controller.frame(now - last);
      if (controller.glass !== getQuality().glass) setGlass(controller.glass);
      if (controller.tier === 0) {
        cancelAnimationFrame(loopFrame);
        onGiveUp();
      } else if (controller.tier !== tier) {
        tier = controller.tier;
        removeObject();
        applyTier();
      }
    }
    last = now;
    const gap = tier === 1 || solver.out.fps === 30 ? HALF_RATE_GAP : 0;
    if (now - lastRender >= gap) {
      lastRender = now;
      invalidate();
    }
  };
  const restart = () => {
    cancelAnimationFrame(loopFrame);
    if (still) {
      // One frame of the hero pose; the glow goes back to its CSS place.
      if (glow) glow.style.transform = glow.style.opacity = '';
      invalidate();
    } else if (!document.hidden) {
      last = 0;
      controller.resume();
      loopFrame = requestAnimationFrame(tick);
    }
  };
  document.addEventListener('visibilitychange', restart);

  return {
    update,
    /** Call with the current mode on mount, and again when it or the canvas size changes. */
    setStill(value: boolean) {
      still = value;
      restart();
    },
    dispose() {
      cancelAnimationFrame(loopFrame);
      cancelAnimationFrame(measureFrame);
      document.removeEventListener('visibilitychange', restart);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', scheduleMeasure);
      observer.disconnect();
      gl.domElement.removeEventListener('webglcontextlost', onLost);
      removeObject();
      scene.environment?.dispose();
      scene.environment = null;
      if (glow) glow.style.transform = glow.style.opacity = '';
      setTier(0);
    },
  };
}

function Rig({ still, lockPose, lockTier, debug, onReady, onGiveUp, setDpr }: RigProps) {
  const get = useThree((state) => state.get);
  const size = useThree((state) => state.size);
  const engine = useRef<ReturnType<typeof createEngine> | null>(null);

  useEffect(() => {
    const created = createEngine(get(), { lockPose, lockTier, debug, onReady, onGiveUp, setDpr });
    engine.current = created;
    return () => {
      engine.current = null;
      created.dispose();
    };
  }, [get, lockPose, lockTier, debug, onReady, onGiveUp, setDpr]);

  useEffect(() => {
    engine.current?.setStill(still);
  }, [still, size]);

  useFrame((_, delta) => engine.current?.update(delta));
  return null;
}

export default function SceneCanvas(props: SceneCanvasProps) {
  // The resolution has to go through the Canvas prop: React Three Fiber re-applies it on every render.
  const [dpr, setDpr] = useState(1);
  return (
    <Canvas
      frameloop="demand"
      dpr={dpr}
      camera={{ fov: FOV, position: [0, 0, CAMERA_Z], near: 1, far: 30 }}
      // Tone mapping stays on React Three Fiber's default, ACES Filmic: next to the reference it
      // turns the hot reds pale salmon, where Neutral keeps them saturated red.
      // The layer is 100lvh tall, so a phone's moving URL bar does not resize it; real resizes are
      // debounced so the drawing buffer is not reallocated on every step of a drag.
      resize={{ scroll: false, debounce: 200 }}
    >
      <Rig {...props} setDpr={setDpr} />
    </Canvas>
  );
}

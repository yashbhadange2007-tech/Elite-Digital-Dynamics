'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

/**
 * SMOKE TEST (foundation). One lit torus: proves that Next, React, React Three Fiber and three
 * work together in this project. Agent S replaces the whole preview route with the real scene.
 */

type SceneDebug = { ready: boolean; frames: number };

/** `window.__scene`, created on first use. Tests read it to see that frames are being drawn. */
function sceneDebug(): SceneDebug {
  const host = window as Window & { __scene?: SceneDebug };
  return (host.__scene ??= { ready: false, frames: 0 });
}

function Torus() {
  const mesh = useRef<Mesh>(null);
  const time = useRef(0);

  // Rocks on two axes, so the hole of the torus stays visible in every screenshot.
  useFrame((_, delta) => {
    time.current += delta;
    if (mesh.current) {
      mesh.current.rotation.x = -0.9 + Math.sin(time.current * 0.8) * 0.35;
      mesh.current.rotation.y = Math.sin(time.current * 0.5) * 0.6;
    }
    sceneDebug().frames += 1;
  });

  return (
    <mesh ref={mesh}>
      <torusGeometry args={[1, 0.36, 48, 128]} />
      <meshStandardMaterial color="#7A140D" metalness={0.6} roughness={0.3} />
    </mesh>
  );
}

export default function SmokeCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.2], fov: 45 }}
      onCreated={() => {
        sceneDebug().ready = true;
      }}
    >
      <directionalLight color="#FFD9CC" intensity={4} position={[3, 4, 5]} />
      <Torus />
    </Canvas>
  );
}

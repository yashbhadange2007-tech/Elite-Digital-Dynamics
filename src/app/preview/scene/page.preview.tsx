'use client';

import dynamic from 'next/dynamic';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';

/**
 * Preview route for agent S: /preview/scene (development only, never built for production).
 * For now it is the foundation's smoke test: a one-mesh React Three Fiber canvas, loaded in the
 * browser only, fixed behind the page on the scene layer (above the glow, under the scrim).
 * It sets `window.__scene = { ready, frames }`. Agent S replaces this route.
 */
const SmokeCanvas = dynamic(() => import('./SmokeCanvas'), { ssr: false });

export default function ScenePreview() {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-(--z-scene)">
        <SmokeCanvas />
      </div>
      <main id="main" className="min-h-svh">
        <VisuallyHidden as="div">
          <h1>Preview: scene</h1>
        </VisuallyHidden>
      </main>
    </>
  );
}

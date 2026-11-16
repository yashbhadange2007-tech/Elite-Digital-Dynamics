'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { DeviceFrame } from '@/components/ui/DeviceFrame';
import { figtree } from '@/lib/fonts';
import { useInView } from '@/lib/hooks';
import styles from './socialsync.module.css';
/**
 * Server-rendered placeholder with the demo's exact footprint (controls row and both frames,
 * one hidden per breakpoint), so swapping in the demo shifts nothing. No text inside the
 * screen, so Figtree is not requested until the demo itself renders.
 */
function Skeleton() {
  return (
    <div className={styles.demo} aria-hidden="true">
      <div className={styles.controls} />
      <div className={styles.frameSlot}>
        {(['phone', 'laptop'] as const).map((variant) => (
          <DeviceFrame key={variant} variant={variant} addressLabel="SocialSync" className={styles.frame}>
            <div className={styles.skeleton} />
          </DeviceFrame>
        ))}
      </div>
    </div>
  );
}

// The chunk and Figtree load together, and the demo appears only once both are in, so the font
// never swaps (and shifts text) after the demo is on screen.
const Demo = dynamic(
  () =>
    Promise.all([
      import('./Demo'),
      document.fonts.load(`1em ${figtree.style.fontFamily}`).catch(() => undefined),
    ]).then(([mod]) => mod),
  { ssr: false, loading: Skeleton },
);

/** Mounts the demo once its slot comes within 600px of the viewport; the skeleton holds its place until then. */
export function DemoLoader() {
  const slot = useRef<HTMLDivElement>(null);
  const near = useInView(slot, { rootMargin: '600px 0px', once: true });
  return (
    <div ref={slot} className={styles.slot} data-demo-slot>
      {near ? <Demo /> : <Skeleton />}
    </div>
  );
}

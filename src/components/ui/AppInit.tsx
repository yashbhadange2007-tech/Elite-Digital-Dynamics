'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect } from 'react';
import { initGlass, initMotionPreference } from '@/lib/quality-store';
import { startScrollTracking } from '@/lib/scroll-store';

/**
 * Starts the two global stores. Rendered once, in the root layout. Renders nothing.
 */
export function AppInit() {
  const pathname = usePathname();

  // Before paint: applies the saved or OS motion preference and the glass mode, and re-applies the root
  // attributes (React resets <html> attributes when Strict Mode remounts in development).
  useLayoutEffect(() => {
    initMotionPreference();
    initGlass();
  }, []);

  // Starts scroll tracking once; on a route change it asks for a fresh measurement of the anchors.
  useEffect(() => {
    startScrollTracking();
  }, [pathname]);

  return null;
}

'use client';

import { useCallback, useEffect, useState, useSyncExternalStore, type RefObject } from 'react';
import { getQuality, getServerQuality, subscribe, type Quality } from './quality-store';

/**
 * Current quality settings. Re-renders when tier, glass or motion changes.
 * For motion decisions use `useQuality().motion === 'still'`: it covers the OS setting and the
 * visitor's Pause control. During hydration it returns the server values (`full`, `lite`, tier 0).
 */
export function useQuality(): Quality {
  return useSyncExternalStore(subscribe, getQuality, getServerQuality);
}

/**
 * True while `query` matches. False on the server and during hydration.
 * Example: `useMediaQuery('(min-width: 64rem)')`.
 */
export function useMediaQuery(query: string): boolean {
  const subscribeToQuery = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribeToQuery,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * The OS `prefers-reduced-motion` setting only. Most components want `useQuality().motion`
 * instead, which also follows the Pause control.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export type UseInViewOptions = {
  /** IntersectionObserver rootMargin, e.g. `'600px 0px'` to fire early. Default `'0px'`. */
  rootMargin?: string;
  /** Stay true after the first intersection and stop observing. Default false. */
  once?: boolean;
};

/**
 * True while the element is in (or within `rootMargin` of) the viewport.
 * Use it to mount heavy content late or to pause work that is off screen.
 */
export function useInView(
  ref: RefObject<Element | null>,
  { rootMargin = '0px', once = false }: UseInViewOptions = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, once]);

  return inView;
}

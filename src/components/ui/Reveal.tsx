'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { getQuality } from '@/lib/quality-store';

export type RevealProps = {
  /** Default `div`. */
  as?: ElementType;
  /** Reveal the direct children one after another (60ms apart) instead of the block as one. */
  stagger?: boolean;
  className?: string;
  children: ReactNode;
};

const STAGGER_SUPPORT = 'transition-delay: calc(sibling-index() * 1ms)';

/**
 * Quiet reveal on scroll: opacity and a 16px rise, once (DESIGN.md 9). Progressive enhancement:
 * the server markup is fully visible and stays so without JavaScript. After hydration only
 * content that is off screen is hidden, and only while motion is `full`; it fades in when it
 * scrolls into view. What is already on screen is never touched, so nothing flashes.
 *
 * Do not wrap the hero h1 (it is the largest paint) or a `primary` glass panel (a blurred
 * element must not animate). At most two reveal groups per viewport.
 */
export function Reveal({ as: Tag = 'div', stagger = false, className, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    if (getQuality().motion !== 'full') return;

    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;

    if (stagger && !CSS.supports(STAGGER_SUPPORT)) {
      Array.from(element.children).forEach((child, index) => {
        (child as HTMLElement).style.setProperty('--sibling-index', String(index + 1));
      });
    }

    element.dataset.reveal = 'pending';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        element.dataset.reveal = 'in';
        observer.disconnect();
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      delete element.dataset.reveal;
    };
  }, [stagger]);

  return (
    <Tag ref={ref} data-stagger={stagger ? '' : undefined} className={cn('ui-reveal', className)}>
      {children}
    </Tag>
  );
}

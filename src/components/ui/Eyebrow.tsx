import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type EyebrowProps = {
  /** Default `p`. */
  as?: 'p' | 'span' | 'div';
  className?: string;
  children: ReactNode;
};

/**
 * Small salmon line above a heading. Sentence case, never uppercase.
 * The home page has exactly two: hero and SocialSync (SPEC.md).
 */
export function Eyebrow({ as: Tag = 'p', className, children }: EyebrowProps) {
  return <Tag className={cn('ui-eyebrow', className)}>{children}</Tag>;
}

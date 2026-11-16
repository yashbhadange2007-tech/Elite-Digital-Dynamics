import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type HeadingLevel = 1 | 2 | 3 | 4;
export type HeadingSize = 'display' | 'h2' | 'h3';

const DEFAULT_SIZE: Record<HeadingLevel, HeadingSize> = { 1: 'display', 2: 'h2', 3: 'h3', 4: 'h3' };

export type HeadingProps = {
  /** The element: 1 gives `<h1>`. One h1 per page, levels in order. */
  level: HeadingLevel;
  /** The look. Default follows the level: 1 display, 2 h2, 3 and 4 h3. */
  size?: HeadingSize;
  id?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Heading with a size token (DESIGN.md 4). Level and size are separate, so the outline can stay
 * correct when the look changes. For emphasis inside a heading use `<strong>`: it renders at
 * weight 500, never italic.
 */
export function Heading({ level, size = DEFAULT_SIZE[level], id, className, children }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag id={id} data-size={size} className={cn('ui-heading', className)}>
      {children}
    </Tag>
  );
}

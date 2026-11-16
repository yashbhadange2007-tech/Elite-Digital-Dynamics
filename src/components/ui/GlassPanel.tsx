import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type GlassPanelProps = {
  /**
   * Marks the one panel in a viewport that may get real backdrop blur (while
   * `<html data-glass="real">`). Every other panel is lite glass. Never nest glass in glass, and
   * never animate the transform or opacity of a primary panel (no `Reveal` around it).
   */
  primary?: boolean;
  /**
   * `glass` (default): the panel recipe of DESIGN.md 6.
   * `flat`: the plain tile for content inside a panel (faint fill, hairline, card radius, no blur).
   */
  tone?: 'glass' | 'flat';
  /** Default `div`. */
  as?: ElementType;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>;

/**
 * Dark glass surface. Default padding is fluid (20px to 48px); override it with a padding
 * utility or `style={{ '--glass-pad': ... }}`.
 */
export function GlassPanel({
  primary = false,
  tone = 'glass',
  as: Tag = 'div',
  className,
  children,
  ...rest
}: GlassPanelProps) {
  return (
    <Tag
      {...rest}
      data-tone={tone}
      data-primary={primary && tone === 'glass' ? '' : undefined}
      className={cn('ui-glass', className)}
    >
      {children}
    </Tag>
  );
}

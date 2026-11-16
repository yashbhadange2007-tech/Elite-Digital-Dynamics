import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ContainerProps = {
  /** Default `div`. */
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

/** Page container: at most 75rem of content, centred, with the fluid page gutter on each side. */
export function Container({ as: Tag = 'div', className, children }: ContainerProps) {
  return <Tag className={cn('ui-container', className)}>{children}</Tag>;
}

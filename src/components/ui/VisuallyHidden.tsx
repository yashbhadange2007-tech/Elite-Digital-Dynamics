import type { ReactNode } from 'react';

export type VisuallyHiddenProps = {
  /** Default `span`. Use `div` when the hidden content is a block. */
  as?: 'span' | 'div';
  children: ReactNode;
};

/** Text for screen readers only. It stays in the DOM, in find-in-page and in the accessible name. */
export function VisuallyHidden({ as: Tag = 'span', children }: VisuallyHiddenProps) {
  return <Tag className="visually-hidden">{children}</Tag>;
}

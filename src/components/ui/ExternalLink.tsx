import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { VisuallyHidden } from './VisuallyHidden';

export type ExternalLinkProps = {
  href: string;
  children: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel' | 'children'>;

/**
 * Link that opens in a new tab: always `target="_blank" rel="noopener noreferrer"`, plus
 * "(opens in new tab)" for screen readers. Unstyled: add `className="ui-link"` for a text link.
 * Client sites are linked as `/visit/<slug>` (a redirect in next.config.ts), never by their URL.
 */
export function ExternalLink({ href, children, ...rest }: ExternalLinkProps) {
  return (
    <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <VisuallyHidden> (opens in new tab)</VisuallyHidden>
    </a>
  );
}

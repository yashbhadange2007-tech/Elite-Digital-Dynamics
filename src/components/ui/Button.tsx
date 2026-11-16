import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { VisuallyHidden } from './VisuallyHidden';

type CommonProps = {
  /** Default `primary`. */
  variant?: 'primary' | 'ghost';
  /** `md` is 44px high (default), `lg` is 52px. */
  size?: 'md' | 'lg';
  /** Trailing icon, e.g. `<ArrowRight />`. Sized to 20px and hidden from screen readers here. */
  icon?: ReactNode;
  /**
   * Disabled or pending: `aria-disabled`, dimmed, still focusable, and inert (a button loses its
   * handler and cannot submit a form, a link loses its href).
   */
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

type LinkProps = CommonProps & {
  /** Renders a link. `/...` paths use next/link, everything else (`#id`, `tel:`, `https:`) a plain `<a>`. */
  href: string;
  /**
   * Opens in a new tab with `rel="noopener noreferrer"` and "(opens in new tab)" for screen
   * readers. Required for `/visit/<slug>` links (next/link must not prefetch a redirect).
   */
  external?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | 'href' | 'target' | 'rel'>;

type NativeButtonProps = CommonProps & {
  href?: undefined;
  external?: undefined;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps>;

export type ButtonProps = LinkProps | NativeButtonProps;

/**
 * Pill button (DESIGN.md 7). One line always. Renders `<a>` when `href` is given, `<button>`
 * otherwise (`type="button"` unless you pass `type="submit"`).
 * No hooks, so it works in server and client components.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const shared = {
    'data-variant': variant,
    'data-size': size,
    'aria-disabled': disabled || undefined,
    className: cn('ui-btn', className),
  };

  const content = (
    <>
      <span className="ui-btn-label">{children}</span>
      {icon ? (
        <span className="ui-btn-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
    </>
  );

  if (rest.href !== undefined) {
    const { href, external = false, ...anchorProps } = rest;

    if (disabled) {
      // A link without href does nothing: the accessible form of a disabled link.
      return (
        <a {...anchorProps} {...shared} role="link">
          {content}
        </a>
      );
    }
    if (external) {
      return (
        <a {...anchorProps} {...shared} href={href} target="_blank" rel="noopener noreferrer">
          {content}
          <VisuallyHidden> (opens in new tab)</VisuallyHidden>
        </a>
      );
    }
    if (href.startsWith('/') && !href.startsWith('//')) {
      return (
        <Link {...anchorProps} {...shared} href={href}>
          {content}
        </Link>
      );
    }
    return (
      <a {...anchorProps} {...shared} href={href}>
        {content}
      </a>
    );
  }

  const { type = 'button', onClick, ...buttonProps } = rest;
  return (
    <button
      {...buttonProps}
      {...shared}
      type={disabled ? 'button' : type}
      onClick={disabled ? undefined : onClick}
    >
      {content}
    </button>
  );
}

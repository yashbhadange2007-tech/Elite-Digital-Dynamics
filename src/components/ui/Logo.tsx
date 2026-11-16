import { cn } from '@/lib/cn';
import { site } from '@/lib/site';
import { VisuallyHidden } from './VisuallyHidden';

/** Files in public/brand with their intrinsic size and the default rendered height. */
const FILES = {
  horizontal: { src: '/brand/edd-lockup-horizontal.svg', width: 373, height: 64, defaultHeight: 32 },
  mark: { src: '/brand/edd-mark.svg', width: 64, height: 64, defaultHeight: 36 },
  stacked: { src: '/brand/edd-lockup-stacked.svg', width: 420, height: 250, defaultHeight: 120 },
} as const;

export type LogoProps = {
  /**
   * `horizontal`: nav on desktop. `mark`: nav on phones. `stacked`: footer (includes the tagline).
   * `mono`: the mark in the current text colour.
   */
  variant: 'horizontal' | 'mark' | 'stacked' | 'mono';
  /** Rendered height in px. Defaults: horizontal 32, mark 36, stacked 120, mono 24. */
  height?: number;
  /** True when the company name is already in text right next to the logo. */
  decorative?: boolean;
  /** Use `lazy` below the fold (the stacked lockup in the footer). */
  loading?: 'eager' | 'lazy';
  /** Class on the image, e.g. `h-[120px] w-auto md:h-[150px]` for a responsive height. */
  className?: string;
};

/**
 * The brand artwork. The image itself has an empty alt; the company name is rendered next to it
 * as visually hidden text unless `decorative` is set.
 */
export function Logo({ variant, height, decorative = false, loading, className }: LogoProps) {
  const name = decorative ? null : <VisuallyHidden>{site.name}</VisuallyHidden>;

  if (variant === 'mono') {
    const size = height ?? 24;
    return (
      <>
        {/* An <img> cannot inherit currentColor, so the one-colour mark is drawn as a mask. */}
        <span
          aria-hidden="true"
          className={cn('ui-logo-mono', className)}
          style={{ inlineSize: size, blockSize: size }}
        />
        {name}
      </>
    );
  }

  const file = FILES[variant];
  const renderedHeight = height ?? file.defaultHeight;
  return (
    <>
      {/* SVG artwork: next/image would not optimise it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={file.src}
        alt=""
        width={Math.round((renderedHeight * file.width) / file.height)}
        height={renderedHeight}
        loading={loading}
        decoding="async"
        className={className}
      />
      {name}
    </>
  );
}

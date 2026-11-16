import { Lock } from '@phosphor-icons/react/dist/ssr/Lock';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './DeviceFrame.module.css';

export type DeviceFrameProps = {
  /**
   * `phone`: 20.5rem wide (less in a narrower container), screen `min(70svh, 560px)` high.
   * `laptop`: as wide as its container, screen 16:10. Put it in a column with a real width
   * (a fraction or a percentage): it cannot size itself from its content.
   */
  variant: 'phone' | 'laptop';
  /** The business name shown in the address bar. Never a URL. */
  addressLabel: string;
  /** Class on the outer frame (width, margins). */
  className?: string;
  /**
   * Screen content. It fills a box of fixed size that clips its overflow, so a child that should
   * scroll needs its own `overflow-y: auto`. The box is an unnamed inline-size container:
   * `@container (min-width: 720px)` inside the content measures the screen, not the page.
   */
  children: ReactNode;
};

/**
 * Phone or laptop frame for the client-site previews and the SocialSync demo (DESIGN.md 7).
 * The address bar is decoration and hidden from screen readers: label the content itself.
 */
export function DeviceFrame({ variant, addressLabel, className, children }: DeviceFrameProps) {
  return (
    <div data-variant={variant} className={cn(styles.frame, styles[variant], className)}>
      <div className={styles.screen}>
        <div className={styles.bar} aria-hidden="true">
          {variant === 'phone' ? <Lock /> : null}
          <span className={styles.label}>{addressLabel}</span>
        </div>
        <div className={styles.viewport}>{children}</div>
      </div>
      {variant === 'laptop' ? <div className={styles.base} aria-hidden="true" /> : null}
    </div>
  );
}

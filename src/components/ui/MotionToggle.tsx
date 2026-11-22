'use client';

import { Pause } from '@phosphor-icons/react/dist/ssr/Pause';
import { Play } from '@phosphor-icons/react/dist/ssr/Play';
import { cn } from '@/lib/cn';
import { useQuality } from '@/lib/hooks';
import { toggleMotion } from '@/lib/quality-store';

export type MotionToggleProps = {
  /** Button text for each state. Default "Pause motion" / "Play motion". */
  labels?: { pause: string; play: string };
  className?: string;
};

const DEFAULT_LABELS = { pause: 'Pause motion', play: 'Play motion' };

/**
 * The visible control that stops and restarts all motion (sculpture, demo tour, reveals) and
 * remembers the choice (WCAG 2.2.2). The label names the action, so there is no `aria-pressed`:
 * a pressed "Play motion" button would be read out as the opposite of what it does.
 */
export function MotionToggle({ labels = DEFAULT_LABELS, className }: MotionToggleProps) {
  const playing = useQuality().motion === 'full';
  const Icon = playing ? Pause : Play;
  return (
    <button type="button" className={cn('ui-pill-link', className)} onClick={toggleMotion}>
      <Icon aria-hidden="true" />
      {playing ? labels.pause : labels.play}
    </button>
  );
}

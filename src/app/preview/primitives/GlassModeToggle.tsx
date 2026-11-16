'use client';

import { useQuality } from '@/lib/hooks';
import { setGlass, type GlassMode } from '@/lib/quality-store';

const MODES: { mode: GlassMode; label: string }[] = [
  { mode: 'lite', label: 'Lite glass' },
  { mode: 'real', label: 'Real glass' },
];

/** Preview only: switches `<html data-glass>` so both panel recipes can be compared. */
export function GlassModeToggle() {
  const { glass } = useQuality();
  return (
    <div role="group" aria-label="Glass mode" className="inline-flex gap-1 rounded-pill border border-hairline p-1">
      {MODES.map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          aria-pressed={glass === mode}
          onClick={() => setGlass(mode)}
          className="ui-pill-link aria-pressed:border-hairline-strong aria-pressed:text-text"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

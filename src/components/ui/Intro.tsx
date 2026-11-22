import type { CSSProperties } from 'react';

const WORDS = ['ELITE', 'DIGITAL', 'DYNAMICS'];

/**
 * The opening brand moment (DESIGN.md 9, Intro): the wordmark resolves letter by letter, a thin
 * pink line sweeps under it, then it shrinks toward the nav logo while the cover fades.
 *
 * Server-rendered and hidden by default. The inline head script (INTRO in quality-store.ts) shows
 * it by setting `<html data-intro="play">`, once per browser session and never under reduced
 * motion; the same script ends it on the first tap, scroll or key. The animation is CSS only and
 * the cover ignores the pointer, so the page loads and works underneath the whole time.
 */
export function Intro() {
  let index = 0;
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-mark">
        {WORDS.map((word, w) => (
          <span key={word} className="intro-word" data-strong={w === 0 || undefined}>
            {[...word].map((letter) => (
              <span key={index} className="intro-letter" style={{ '--i': index++ } as CSSProperties}>
                {letter}
              </span>
            ))}
          </span>
        ))}
        <span className="intro-line" />
      </div>
    </div>
  );
}

import { MotionToggle } from './MotionToggle';

const MOTION_LABELS = { pause: 'Pause background motion', play: 'Play background motion' };

/**
 * The first two tab stops of every page: "Skip to content" (to `<main id="main">`), then
 * "Pause background motion". Hidden until one of them has keyboard focus.
 * Every page must render `<main id="main">`.
 */
export function SkipLinks() {
  return (
    <div className="ui-skip-links visually-hidden">
      <a className="ui-pill-link" href="#main">
        Skip to content
      </a>
      <MotionToggle labels={MOTION_LABELS} />
    </div>
  );
}

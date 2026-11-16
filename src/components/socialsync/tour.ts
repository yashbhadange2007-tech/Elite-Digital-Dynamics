import { PLATFORMS, SAMPLE, SEED_COUNT, defaultSlot, publishBlocker, type Action, type State } from './machine';

/**
 * The guided loop: create, schedule, preview, publish, published, analytics, compare, again.
 * Given any state it returns the next action and how long to wait before dispatching it, so the
 * tour can resume from wherever a visitor (or a step chip) left the demo. The runner keeps one
 * timer at a time. Returns null while the app itself is busy (publishing to the platforms).
 * One loop takes about 35 seconds.
 */
export type TourMove = { delay: number; action: Action };

const TYPE_CHUNK = 6;
const TYPE_DELAY = 120;

/** The next few characters of `target`; starts over when `current` is not a prefix of it. */
function typeAhead(current: string, target: string): string {
  return target.startsWith(current) ? target.slice(0, current.length + TYPE_CHUNK) : '';
}

export function nextTourMove(s: State): TourMove | null {
  const d = s.draft;

  if (s.screen === 'analytics') {
    return s.analyticsView === 'platforms'
      ? { delay: 4000, action: { type: 'SET_ANALYTICS_VIEW', view: 'compare' } }
      : { delay: 5000, action: { type: 'RESET' } };
  }

  if (s.screen !== 'create') {
    return s.posts.length > SEED_COUNT
      ? { delay: 3500, action: { type: 'NAVIGATE', screen: 'analytics' } }
      : { delay: 1500, action: { type: 'NAVIGATE', screen: 'create' } };
  }

  if (s.publish.status === 'publishing') return null;
  if (s.publish.status === 'done') return { delay: 1800, action: { type: 'NAVIGATE', screen: 'home' } };

  if (d.stage === 'write') {
    if (!d.media) return { delay: 900, action: { type: 'ADD_MEDIA' } };
    const missing = PLATFORMS.find((p) => !d.platforms.includes(p));
    if (missing) return { delay: 600, action: { type: 'TOGGLE_PLATFORM', platform: missing } };
    if (d.text !== SAMPLE.text) return { delay: TYPE_DELAY, action: { type: 'SET_TEXT', text: typeAhead(d.text, SAMPLE.text) } };
    if (d.ytTitle !== SAMPLE.ytTitle) {
      return { delay: TYPE_DELAY, action: { type: 'SET_YT_TITLE', text: typeAhead(d.ytTitle, SAMPLE.ytTitle) } };
    }
    return { delay: 900, action: { type: 'SET_STAGE', stage: 'when' } };
  }

  if (d.stage === 'when') {
    if (d.when !== 'later') return { delay: 1200, action: { type: 'SET_WHEN', when: 'later' } };
    if (publishBlocker(d, Date.now())?.startsWith('Pick')) {
      const slot = defaultSlot(Date.now());
      if (d.date !== slot.date) return { delay: 600, action: { type: 'SET_DATE', date: slot.date } };
      return { delay: 600, action: { type: 'SET_TIME', time: slot.time } };
    }
    return { delay: 1800, action: { type: 'SET_STAGE', stage: 'preview' } };
  }

  // Preview: show each platform's preview, then publish. A visitor may have left the draft
  // unpublishable; send the tour back to writing so it fills the gaps.
  if (publishBlocker(d, Date.now())) return { delay: 900, action: { type: 'SET_STAGE', stage: 'write' } };
  const next = d.platforms[d.platforms.indexOf(d.previewTab) + 1];
  if (next) return { delay: 1500, action: { type: 'SET_PREVIEW', platform: next } };
  return { delay: 1500, action: { type: 'PUBLISH' } };
}

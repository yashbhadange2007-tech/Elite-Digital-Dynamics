import { describe, expect, it } from 'vitest';
import { initialState, publishBlocker, reducer, stepOf, type State } from './machine';
import { nextTourMove } from './tour';

/** Runs the tour from `s` until it resets, the way the demo runner does (publish ticks every 900 ms). */
function runLoop(start: State) {
  let s = start;
  let elapsed = 0;
  const steps: string[] = [stepOf(s)];
  for (let i = 0; i < 500; i++) {
    const move = nextTourMove(s);
    const [delay, action] = move ? [move.delay, move.action] : [900, { type: 'PLATFORM_REACHED' } as const];
    elapsed += delay;
    s = reducer(s, action);
    if (steps.at(-1) !== stepOf(s)) steps.push(stepOf(s));
    if (action.type === 'RESET') return { s, elapsed, steps };
  }
  throw new Error('tour never reset');
}

describe('guided tour', () => {
  it('walks every step in order, then starts again, in 30 to 45 seconds', () => {
    const { s, elapsed, steps } = runLoop(initialState(Date.now(), 'tour'));
    expect(steps).toEqual(['start', 'create', 'schedule', 'preview', 'publish', 'published', 'analytics', 'compare', 'start']);
    expect(elapsed).toBeGreaterThanOrEqual(30_000);
    expect(elapsed).toBeLessThanOrEqual(45_000);
    expect(s.screen).toBe('home');
  });

  it('fills the post completely before it schedules it', () => {
    let s = initialState(Date.now(), 'tour');
    while (stepOf(s) !== 'schedule') s = reducer(s, nextTourMove(s)!.action);
    expect(s.draft.media).toBe(true);
    expect(s.draft.platforms).toEqual(['instagram', 'facebook', 'youtube']);
    expect(s.draft.ytTitle.length).toBeGreaterThan(0);
    expect(publishBlocker(s.draft, Date.now())).toBeNull();
  });

  it('resumes from any step chip and from a visitor-broken draft', () => {
    for (const step of ['create', 'schedule', 'published', 'analytics'] as const) {
      const jumped = reducer(initialState(Date.now(), 'tour'), { type: 'JUMP', step });
      expect(runLoop(jumped).s.screen).toBe('home');
    }
    let s = reducer(initialState(Date.now(), 'tour'), { type: 'JUMP', step: 'schedule' });
    s = reducer(s, { type: 'SET_YT_TITLE', text: '' });
    s = reducer(s, { type: 'SET_TIME', time: '00:00' });
    s = reducer(s, { type: 'SET_DATE', date: '2020-01-01' });
    s = reducer(s, { type: 'SET_STAGE', stage: 'preview' });
    expect(runLoop(s).steps).toContain('published');
  });

  it('blocks publishing to YouTube without a title, with a reason', () => {
    let s = initialState(Date.now(), 'manual');
    s = reducer(s, { type: 'TOGGLE_PLATFORM', platform: 'youtube' });
    s = reducer(s, { type: 'SET_TEXT', text: 'Hello' });
    expect(publishBlocker(s.draft, Date.now())).toMatch(/YouTube title/);
    expect(reducer(s, { type: 'PUBLISH' }).publish.status).toBe('idle');
    s = reducer(s, { type: 'SET_YT_TITLE', text: 'A title' });
    expect(reducer(s, { type: 'PUBLISH' }).publish.status).toBe('publishing');
  });
});

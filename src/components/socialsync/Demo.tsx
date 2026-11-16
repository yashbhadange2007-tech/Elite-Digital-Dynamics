'use client';

import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';
import { GearSix } from '@phosphor-icons/react/dist/ssr/GearSix';
import { House } from '@phosphor-icons/react/dist/ssr/House';
import { Pause } from '@phosphor-icons/react/dist/ssr/Pause';
import { Play } from '@phosphor-icons/react/dist/ssr/Play';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { Rows } from '@phosphor-icons/react/dist/ssr/Rows';
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree';
import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DeviceFrame } from '@/components/ui/DeviceFrame';
import { cn } from '@/lib/cn';
import { figtree } from '@/lib/fonts';
import { useMediaQuery, useQuality } from '@/lib/hooks';
import { getQuality } from '@/lib/quality-store';
import { initialState, reducer, stepOf, type JumpStep, type Screen, type Step } from './machine';
import { Logo, SCREENS } from './screens';
import styles from './socialsync.module.css';
import { nextTourMove } from './tour';

const NAV: { screen: Screen; label: string; Icon: typeof House }[] = [
  { screen: 'home', label: 'Home', Icon: House },
  { screen: 'calendar', label: 'Calendar', Icon: CalendarBlank },
  { screen: 'posts', label: 'Posts', Icon: Rows },
  { screen: 'analytics', label: 'Analytics', Icon: ChartBar },
  { screen: 'accounts', label: 'Accounts', Icon: UsersThree },
  { screen: 'settings', label: 'Settings', Icon: GearSix },
];

const CHIPS: { step: JumpStep; label: string; covers: Step[] }[] = [
  { step: 'create', label: 'Create', covers: ['create'] },
  { step: 'schedule', label: 'Schedule', covers: ['schedule', 'preview', 'publish'] },
  { step: 'published', label: 'Published', covers: ['published'] },
  { step: 'analytics', label: 'Analytics', covers: ['analytics', 'compare'] },
];

/**
 * The SocialSync demo: controls, device frame and the app inside it. Loaded on demand by
 * SocialSyncShowcase. The tour runs only while it is in tour mode, at least a quarter on screen,
 * the tab is visible and focus is outside the app.
 */
export default function Demo() {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    initialState(Date.now(), getQuality().motion === 'still' ? 'manual' : 'tour'),
  );
  const { motion } = useQuality();
  const laptop = useMediaQuery('(min-width: 64rem)');
  const frameRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const lastTourTarget = useRef<string | null>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [focusInside, setFocusInside] = useState(false);

  const step = stepOf(state);
  const running = state.mode === 'tour' && onScreen && !tabHidden && !focusInside;

  // Reduced motion or the site's Pause motion: never play by itself.
  useEffect(() => {
    if (motion === 'still') dispatch({ type: 'TAKE_CONTROL' });
  }, [motion]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.intersectionRatio >= 0.25), {
      threshold: [0, 0.25, 0.5],
    });
    observer.observe(frame);
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // The guided tour: one timer at a time, dispatching the same actions as the buttons.
  useEffect(() => {
    if (!running) return;
    const move = nextTourMove(state);
    if (!move) return;
    const id = window.setTimeout(() => {
      lastTourTarget.current = move.action.type;
      dispatch(move.action);
    }, move.delay);
    return () => window.clearTimeout(id);
  }, [running, state]);

  // The app's own work: the post reaches one platform after another.
  useEffect(() => {
    if (state.publish.status !== 'publishing') return;
    const id = window.setTimeout(() => dispatch({ type: 'PLATFORM_REACHED' }), 900);
    return () => window.clearTimeout(id);
  }, [state.publish]);

  // A new screen or composer step starts at the top.
  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [state.screen, state.draft.stage, state.publish.status]);

  // Keep what the tour just changed in view, scrolling only the app (never the page).
  useEffect(() => {
    const main = mainRef.current;
    const target = lastTourTarget.current && main?.querySelector(`[data-tour-target="${lastTourTarget.current}"]`);
    lastTourTarget.current = null;
    if (!main || !target) return;
    const box = main.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    if (rect.top < box.top || rect.bottom > box.bottom) {
      main.scrollTo({ top: main.scrollTop + rect.top - box.top - 12, behavior: motion === 'still' ? 'instant' : 'smooth' });
    }
  }, [state, motion]);

  const takeControl = () => dispatch({ type: 'TAKE_CONTROL' });
  const Screen = SCREENS[state.screen];

  const controls = (
    <div className={styles.controls}>
      <Button
        variant="ghost"
        className={styles.tourBtn}
        icon={state.mode === 'tour' ? <Pause weight="fill" /> : <Play weight="fill" />}
        onClick={() => dispatch({ type: state.mode === 'tour' ? 'TAKE_CONTROL' : 'RESUME' })}
      >
        {state.mode === 'tour' ? 'Pause tour' : 'Resume tour'}
      </Button>
      <div className={styles.chips} role="group" aria-label="Jump to a step">
        {CHIPS.map((chip) => (
          <button
            key={chip.step}
            type="button"
            className={styles.chip}
            aria-current={chip.covers.includes(step) ? 'step' : undefined}
            onClick={() => dispatch({ type: 'JUMP', step: chip.step })}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={styles.demo}
      data-socialsync
      data-step={step}
      data-screen={state.screen}
      data-mode={state.mode}
      data-running={running}
    >
      {controls}
      <div ref={frameRef} className={styles.frameSlot} data-demo-frame>
        <DeviceFrame variant={laptop ? 'laptop' : 'phone'} addressLabel="SocialSync" className={styles.frame}>
          <div
            ref={appRef}
            className={cn(styles.app, figtree.variable)}
            role="group"
            aria-label="SocialSync demo app"
            onPointerDown={takeControl}
            onKeyDown={takeControl}
            onFocus={() => setFocusInside(true)}
            onBlur={(e) => {
              if (!appRef.current?.contains(e.relatedTarget as Node | null)) setFocusInside(false);
            }}
          >
            <div className={styles.side}>
              <div className={styles.brand}>
                <Logo className={styles.brandMark} />
                <span className={styles.brandName}>SocialSync</span>
              </div>
              <button
                type="button"
                className={styles.createBtn}
                aria-current={state.screen === 'create' ? 'page' : undefined}
                onClick={() => dispatch({ type: 'NAVIGATE', screen: 'create' })}
              >
                <Plus weight="bold" aria-hidden="true" /> Create post
              </button>
              <nav className={styles.nav} aria-label="SocialSync">
                {NAV.map(({ screen, label, Icon }) => (
                  <button
                    key={screen}
                    type="button"
                    aria-current={state.screen === screen ? 'page' : undefined}
                    onClick={() => dispatch({ type: 'NAVIGATE', screen })}
                  >
                    <Icon weight={state.screen === screen ? 'fill' : 'regular'} aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <p className={styles.sample}>Sample data, nothing is posted</p>
            <div ref={mainRef} className={styles.main} tabIndex={0} role="region" aria-label={NAV.find((n) => n.screen === state.screen)?.label ?? 'Create post'}>
              <Screen s={state} dispatch={dispatch} />
            </div>
          </div>
        </DeviceFrame>
      </div>
    </div>
  );
}

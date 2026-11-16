/**
 * SocialSync demo state: one plain reducer for everything (docs/ARCHITECTURE.md 5).
 * The buttons and the guided tour (tour.ts) dispatch the same actions, so they cannot disagree.
 * All sample content is invented: no real people, handles or numbers.
 */

export const PLATFORMS = ['instagram', 'facebook', 'youtube'] as const;
export type Platform = (typeof PLATFORMS)[number];
export const PLATFORM_NAME: Record<Platform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook Page',
  youtube: 'YouTube',
};

export type Screen = 'home' | 'calendar' | 'posts' | 'analytics' | 'accounts' | 'settings' | 'create';
export type Stage = 'write' | 'when' | 'preview';
/** Where the demo is in the guided story, derived from the state (never stored). */
export type Step = 'start' | 'create' | 'schedule' | 'preview' | 'publish' | 'published' | 'analytics' | 'compare';
export type JumpStep = 'create' | 'schedule' | 'published' | 'analytics';

export type Card = { kicker: string; title: string; tone: 'teal' | 'mint' | 'navy' };
export type Post = {
  id: string;
  title: string;
  card: Card;
  platforms: Platform[];
  /** Epoch ms. */
  at: number;
  status: 'scheduled' | 'published';
};

export type Draft = {
  media: boolean;
  platforms: Platform[];
  text: string;
  /** A key is present when that platform uses its own text. */
  overrides: Partial<Record<Platform, string>>;
  ytTitle: string;
  when: 'now' | 'later';
  /** IST wall clock, as the date and time inputs want it: YYYY-MM-DD and HH:MM. */
  date: string;
  time: string;
  stage: Stage;
  previewTab: Platform;
};

export type State = {
  mode: 'tour' | 'manual';
  /** Mount time (epoch ms). Sample times are relative to it. */
  base: number;
  screen: Screen;
  draft: Draft;
  publish: { status: 'idle' | 'publishing' | 'done'; reached: Platform[] };
  posts: Post[];
  analyticsView: 'platforms' | 'compare';
};

export type Action =
  | { type: 'NAVIGATE'; screen: Screen }
  | { type: 'ADD_MEDIA' }
  | { type: 'REMOVE_MEDIA' }
  | { type: 'TOGGLE_PLATFORM'; platform: Platform }
  | { type: 'SET_TEXT'; text: string }
  | { type: 'SET_OVERRIDE'; platform: Platform; text: string | null }
  | { type: 'SET_YT_TITLE'; text: string }
  | { type: 'SET_WHEN'; when: 'now' | 'later' }
  | { type: 'SET_DATE'; date: string }
  | { type: 'SET_TIME'; time: string }
  | { type: 'SET_STAGE'; stage: Stage }
  | { type: 'SET_PREVIEW'; platform: Platform }
  | { type: 'PUBLISH' }
  | { type: 'PLATFORM_REACHED' }
  | { type: 'SET_ANALYTICS_VIEW'; view: 'platforms' | 'compare' }
  | { type: 'TAKE_CONTROL' }
  | { type: 'RESUME' }
  | { type: 'JUMP'; step: JumpStep }
  | { type: 'RESET' };

// ---- Time (IST is UTC+05:30 all year, no daylight saving) ----

export const IST = 'Asia/Kolkata';
const IST_OFFSET_MS = 330 * 60_000;

/** The IST date (YYYY-MM-DD) and time (HH:MM) of an instant. */
export function istFields(ms: number): { date: string; time: string } {
  const iso = new Date(ms + IST_OFFSET_MS).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/** Epoch ms of an IST date and time. NaN when either is empty or invalid. */
export function istToMs(date: string, time: string): number {
  return Date.parse(`${date}T${time}:00+05:30`);
}

const whenFormat = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});
/** "Tue, 17 Nov, 4:30 pm IST". */
export function formatIst(ms: number): string {
  return `${whenFormat.format(ms)} IST`;
}

// ---- Sample content ----

export const SAMPLE = {
  text: 'Desk job? Try this 30-second neck release: sit tall, tuck your chin, then tilt one ear toward your shoulder. Hold 10 seconds each side.',
  ytTitle: '30-second neck release for desk workers',
  card: { kicker: 'Desk tip', title: '30-second neck release', tone: 'teal' } satisfies Card,
};

/** The sample schedule: two hours after `from`, rounded up to the next quarter hour, in IST. */
export function defaultSlot(base: number) {
  const quarter = 15 * 60_000;
  return istFields(Math.ceil((base + 2 * 3_600_000) / quarter) * quarter);
}

function seedPosts(base: number): Post[] {
  const hour = 3_600_000;
  return [
    {
      id: 'seed-1',
      title: 'Weekend stretch reminder',
      card: { kicker: 'Weekend', title: 'Five-minute stretch break', tone: 'mint' },
      platforms: ['instagram', 'facebook'],
      at: base + 5 * hour,
      status: 'scheduled',
    },
    {
      id: 'seed-2',
      title: 'Morning mobility routine',
      card: { kicker: 'Video', title: 'Morning mobility in 3 moves', tone: 'navy' },
      platforms: ['instagram', 'facebook', 'youtube'],
      at: base - 26 * hour,
      status: 'published',
    },
    {
      id: 'seed-3',
      title: 'Better posture at work',
      card: { kicker: 'Posture', title: 'Screen at eye level', tone: 'teal' },
      platforms: ['instagram', 'youtube'],
      at: base - 74 * hour,
      status: 'published',
    },
  ];
}
export const SEED_COUNT = 3;

function emptyDraft(base: number): Draft {
  return {
    media: false,
    platforms: [],
    text: '',
    overrides: {},
    ytTitle: '',
    when: 'now',
    ...defaultSlot(base),
    stage: 'write',
    previewTab: 'instagram',
  };
}

function filledDraft(base: number): Draft {
  return { ...emptyDraft(base), media: true, platforms: [...PLATFORMS], text: SAMPLE.text, ytTitle: SAMPLE.ytTitle };
}

export function initialState(base: number, mode: State['mode']): State {
  return {
    mode,
    base,
    screen: 'home',
    draft: emptyDraft(base),
    publish: { status: 'idle', reached: [] },
    posts: seedPosts(base),
    analyticsView: 'platforms',
  };
}

// ---- Derived ----

/** Why the post cannot be published yet, or null when it can. */
export function publishBlocker(draft: Draft, now: number): string | null {
  if (draft.platforms.length === 0) return 'Choose at least one platform.';
  if (!draft.text.trim()) return 'Write the post text.';
  if (draft.platforms.includes('youtube') && !draft.ytTitle.trim()) return 'Add a YouTube title to publish on YouTube.';
  if (draft.when === 'later') {
    const at = istToMs(draft.date, draft.time);
    if (Number.isNaN(at)) return 'Pick a date and time.';
    if (at <= now) return 'Pick a time in the future.';
  }
  return null;
}

export function stepOf(s: State): Step {
  if (s.screen === 'create') {
    if (s.publish.status !== 'idle') return 'publish';
    return s.draft.stage === 'write' ? 'create' : s.draft.stage === 'when' ? 'schedule' : 'preview';
  }
  if (s.screen === 'analytics') return s.analyticsView === 'compare' ? 'compare' : 'analytics';
  return s.posts.length > SEED_COUNT ? 'published' : 'start';
}

function draftToPost(draft: Draft, now: number): Post {
  return {
    id: `post-${now}`,
    title: draft.ytTitle.trim() || draft.text.trim().slice(0, 40),
    card: draft.media ? SAMPLE.card : { kicker: 'Text post', title: draft.text.trim().slice(0, 40), tone: 'mint' },
    platforms: draft.platforms,
    at: draft.when === 'later' ? istToMs(draft.date, draft.time) : now,
    status: draft.when === 'later' ? 'scheduled' : 'published',
  };
}

// ---- Reducer ----

export function reducer(s: State, a: Action): State {
  const d = s.draft;
  const edit = (patch: Partial<Draft>): State => ({ ...s, draft: { ...d, ...patch } });

  switch (a.type) {
    case 'NAVIGATE':
      // Opening Create after a finished publish starts a fresh post.
      if (a.screen === 'create' && s.publish.status === 'done') {
        return { ...s, screen: 'create', draft: emptyDraft(s.base), publish: { status: 'idle', reached: [] } };
      }
      return { ...s, screen: a.screen };
    case 'ADD_MEDIA':
      return edit({ media: true });
    case 'REMOVE_MEDIA':
      return edit({ media: false });
    case 'TOGGLE_PLATFORM': {
      const on = d.platforms.includes(a.platform);
      const platforms = PLATFORMS.filter((p) => (p === a.platform ? !on : d.platforms.includes(p)));
      const overrides = { ...d.overrides };
      if (on) delete overrides[a.platform];
      return edit({ platforms, overrides });
    }
    case 'SET_TEXT':
      return edit({ text: a.text });
    case 'SET_OVERRIDE': {
      const overrides = { ...d.overrides };
      if (a.text === null) delete overrides[a.platform];
      else overrides[a.platform] = a.text;
      return edit({ overrides });
    }
    case 'SET_YT_TITLE':
      return edit({ ytTitle: a.text });
    case 'SET_WHEN':
      return edit({ when: a.when });
    case 'SET_DATE':
      return edit({ date: a.date });
    case 'SET_TIME':
      return edit({ time: a.time });
    case 'SET_STAGE':
      return edit({
        stage: a.stage,
        previewTab: d.platforms.includes(d.previewTab) ? d.previewTab : (d.platforms[0] ?? 'instagram'),
      });
    case 'SET_PREVIEW':
      return edit({ previewTab: a.platform });
    case 'PUBLISH':
      if (s.publish.status !== 'idle' || publishBlocker(d, Date.now())) return s;
      return { ...s, publish: { status: 'publishing', reached: [] } };
    case 'PLATFORM_REACHED': {
      if (s.publish.status !== 'publishing') return s;
      const next = d.platforms.find((p) => !s.publish.reached.includes(p));
      if (!next) return s;
      const reached = [...s.publish.reached, next];
      if (reached.length < d.platforms.length) return { ...s, publish: { status: 'publishing', reached } };
      return { ...s, publish: { status: 'done', reached }, posts: [draftToPost(d, Date.now()), ...s.posts] };
    }
    case 'SET_ANALYTICS_VIEW':
      return { ...s, analyticsView: a.view };
    case 'TAKE_CONTROL':
      return s.mode === 'manual' ? s : { ...s, mode: 'manual' };
    case 'RESUME':
      return { ...s, mode: 'tour' };
    case 'JUMP': {
      const fresh = initialState(s.base, s.mode);
      if (a.step === 'create') return { ...fresh, screen: 'create' };
      if (a.step === 'schedule') {
        return { ...fresh, screen: 'create', draft: { ...filledDraft(s.base), stage: 'when', when: 'later' } };
      }
      const posts = [draftToPost({ ...filledDraft(s.base), when: 'later' }, s.base), ...fresh.posts];
      return { ...fresh, posts, screen: a.step === 'published' ? 'home' : 'analytics' };
    }
    case 'RESET':
      return initialState(s.base, s.mode);
  }
}

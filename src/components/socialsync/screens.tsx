'use client';

import { FacebookLogo } from '@phosphor-icons/react/dist/ssr/FacebookLogo';
import { ImageSquare } from '@phosphor-icons/react/dist/ssr/ImageSquare';
import { InstagramLogo } from '@phosphor-icons/react/dist/ssr/InstagramLogo';
import { YoutubeLogo } from '@phosphor-icons/react/dist/ssr/YoutubeLogo';
import { useEffect, useState, type Dispatch, type ReactNode } from 'react';
import {
  IST,
  PLATFORMS,
  PLATFORM_NAME,
  SAMPLE,
  formatIst,
  istToMs,
  publishBlocker,
  type Action,
  type Card,
  type Platform,
  type State,
} from './machine';
import styles from './socialsync.module.css';

type ScreenProps = { s: State; dispatch: Dispatch<Action> };

// ---- Brand pieces ----

const ARCS = [
  { d: 'M40.13 13.73A20 20 0 0 1 51.89 34.09', color: 'navy' },
  { d: 'M43.76 48.18A20 20 0 0 1 20.24 48.18', color: 'teal' },
  { d: 'M12.11 34.09A20 20 0 0 1 23.87 13.73', color: 'navy' },
] as const;
const NODES = [
  { cx: 32, cy: 12, color: 'teal' },
  { cx: 49.3, cy: 42, color: 'teal' },
  { cx: 14.7, cy: 42, color: 'navy' },
] as const;
const logoVar = (color: 'teal' | 'navy') => `var(--ss-logo-${color})`;

/** The SocialSync mark, drawn from the brief's paths. Colours come from --ss-logo-teal / --ss-logo-navy. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" strokeWidth={6} strokeLinecap="round" className={className} aria-hidden="true">
      {ARCS.map((arc) => (
        <path key={arc.d} d={arc.d} stroke={logoVar(arc.color)} />
      ))}
      {NODES.map((n) => (
        <circle key={n.cx} cx={n.cx} cy={n.cy} r={6.5} fill={logoVar(n.color)} />
      ))}
    </svg>
  );
}

/**
 * The publish ring: the mark, greyed, filling in as the post reaches each platform.
 * Platform i draws arc i (stroke-dashoffset) and lights the node at its end.
 */
function PublishRing({ platforms, reached }: { platforms: Platform[]; reached: Platform[] }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" strokeWidth={6} strokeLinecap="round" className={styles.ring} aria-hidden="true">
      {PLATFORMS.map((p, i) => {
        const node = NODES[(i + 1) % 3];
        const on = reached.includes(p);
        return (
          <g key={p} data-on={on} data-used={platforms.includes(p)}>
            <path d={ARCS[i].d} className={styles.ringTrack} />
            <path d={ARCS[i].d} pathLength={1} className={styles.ringArc} stroke={logoVar(ARCS[i].color)} />
            <circle cx={node.cx} cy={node.cy} r={6.5} className={styles.ringNodeTrack} />
            <circle cx={node.cx} cy={node.cy} r={6.5} className={styles.ringNode} fill={logoVar(node.color)} />
          </g>
        );
      })}
    </svg>
  );
}

const ICONS = { instagram: InstagramLogo, facebook: FacebookLogo, youtube: YoutubeLogo };

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const Icon = ICONS[platform];
  return <Icon weight="fill" className={className} data-platform={platform} aria-hidden="true" />;
}

function PlatformRow({ platforms }: { platforms: Platform[] }) {
  return (
    <span className={styles.platformRow} aria-label={platforms.map((p) => PLATFORM_NAME[p]).join(', ')} role="img">
      {platforms.map((p) => (
        <PlatformIcon key={p} platform={p} />
      ))}
    </span>
  );
}

/** Sample "photo": a designed tip card in the SocialSync palette (HTML and CSS, no image file). */
function MediaCard({ card, className }: { card: Card; className?: string }) {
  return (
    <div className={`${styles.media} ${className ?? ''}`} data-tone={card.tone} role="img" aria-label={`Tip card: ${card.title}`}>
      <span className={styles.mediaInner}>
        <span className={styles.mediaKicker}>{card.kicker}</span>
        <span className={styles.mediaTitle}>{card.title}</span>
        <span className={styles.mediaDots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </span>
    </div>
  );
}

// ---- Home ----

function greeting(base: number) {
  const hour = Number(new Intl.DateTimeFormat('en-IN', { timeZone: IST, hour: 'numeric', hourCycle: 'h23' }).format(base));
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

function Countdown({ at }: { at: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const left = Math.max(0, Math.floor((at - now) / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  const text = `${pad(Math.floor(left / 3600))}:${pad(Math.floor(left / 60) % 60)}:${pad(left % 60)}`;
  return (
    <span className={styles.countdown} data-countdown>
      {text}
    </span>
  );
}

function HomeScreen({ s, dispatch }: ScreenProps) {
  const upcoming = s.posts.filter((p) => p.status === 'scheduled').sort((a, b) => a.at - b.at);
  const next = upcoming[0];
  const published = s.posts.filter((p) => p.status === 'published');
  return (
    <>
      <h3 className={styles.title}>{greeting(s.base)}, Demo Clinic team</h3>
      <p className={styles.muted}>Here is what goes out next.</p>
      {next ? (
        <article className={styles.stage} data-tour-target="NAVIGATE">
          <MediaCard card={next.card} className={styles.stageMedia} />
          <div className={styles.stageBody}>
            <p className={styles.stageKicker}>Next post</p>
            <h4 className={styles.stageTitle}>{next.title}</h4>
            <p className={styles.stageMeta}>{formatIst(next.at)}</p>
            <PlatformRow platforms={next.platforms} />
          </div>
          <div className={styles.stageFoot}>
            <p className={styles.stageMeta}>
              Goes live in <Countdown at={next.at} />
            </p>
            <button type="button" className={styles.mintBtn} onClick={() => dispatch({ type: 'NAVIGATE', screen: 'posts' })}>
              See all posts
            </button>
          </div>
        </article>
      ) : null}
      <dl className={styles.stats}>
        <div>
          <dt>Scheduled</dt>
          <dd>{upcoming.length}</dd>
        </div>
        <div>
          <dt>Published</dt>
          <dd>{published.length}</dd>
        </div>
        <div>
          <dt>Engagement</dt>
          <dd>4.8%</dd>
        </div>
      </dl>
    </>
  );
}

// ---- Create post ----

const STAGES = [
  { id: 'write', label: 'Write' },
  { id: 'when', label: 'When' },
  { id: 'preview', label: 'Preview' },
] as const;

function CreateScreen({ s, dispatch }: ScreenProps) {
  const d = s.draft;
  if (s.publish.status !== 'idle') return <PublishView s={s} dispatch={dispatch} />;
  const go = (stage: (typeof STAGES)[number]['id']) => dispatch({ type: 'SET_STAGE', stage });

  return (
    <>
      <h3 className={styles.title}>Create post</h3>
      <ol className={styles.stepper} aria-label="Post steps">
        {STAGES.map((st, i) => (
          <li key={st.id}>
            <button type="button" aria-current={d.stage === st.id ? 'step' : undefined} onClick={() => go(st.id)}>
              <span aria-hidden="true">{i + 1}</span> {st.label}
            </button>
          </li>
        ))}
      </ol>
      {d.stage === 'write' ? <WriteStage s={s} dispatch={dispatch} /> : null}
      {d.stage === 'when' ? <WhenStage s={s} dispatch={dispatch} /> : null}
      {d.stage === 'preview' ? <PreviewStage s={s} dispatch={dispatch} /> : null}
    </>
  );
}

function WriteStage({ s, dispatch }: ScreenProps) {
  const d = s.draft;
  return (
    <>
      <div className={styles.field} data-tour-target="ADD_MEDIA">
        <span className={styles.label}>Photo or video</span>
        {d.media ? (
          <div className={styles.mediaPicked}>
            <MediaCard card={SAMPLE.card} className={styles.thumb} />
            <span className={styles.muted}>neck-release.jpg, used on every platform</span>
            <button type="button" className={styles.linkBtn} onClick={() => dispatch({ type: 'REMOVE_MEDIA' })}>
              Remove
            </button>
          </div>
        ) : (
          <button type="button" className={styles.dropzone} onClick={() => dispatch({ type: 'ADD_MEDIA' })}>
            <ImageSquare aria-hidden="true" /> Add photo or video
          </button>
        )}
      </div>

      <fieldset className={styles.field} data-tour-target="TOGGLE_PLATFORM">
        <legend className={styles.label}>Platforms</legend>
        <div className={styles.chipRow}>
          {PLATFORMS.map((p) => (
            <label key={p} className={styles.checkChip}>
              <input
                type="checkbox"
                checked={d.platforms.includes(p)}
                onChange={() => dispatch({ type: 'TOGGLE_PLATFORM', platform: p })}
              />
              <PlatformIcon platform={p} />
              {PLATFORM_NAME[p]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.field} data-tour-target="SET_TEXT">
        <label className={styles.label} htmlFor="ss-text">
          Post text
        </label>
        <textarea
          id="ss-text"
          className={styles.input}
          rows={4}
          value={d.text}
          onChange={(e) => dispatch({ type: 'SET_TEXT', text: e.target.value })}
        />
      </div>

      {d.platforms.length > 0 ? (
        <fieldset className={styles.field}>
          <legend className={styles.label}>Different text for a platform (optional)</legend>
          {d.platforms.map((p) => {
            const custom = d.overrides[p];
            return (
              <div key={p} className={styles.override}>
                <label className={styles.checkLine}>
                  <input
                    type="checkbox"
                    checked={custom !== undefined}
                    onChange={(e) => dispatch({ type: 'SET_OVERRIDE', platform: p, text: e.target.checked ? d.text : null })}
                  />
                  Own text for {PLATFORM_NAME[p]}
                </label>
                {custom !== undefined ? (
                  <textarea
                    aria-label={`Text for ${PLATFORM_NAME[p]}`}
                    className={styles.input}
                    rows={3}
                    value={custom}
                    onChange={(e) => dispatch({ type: 'SET_OVERRIDE', platform: p, text: e.target.value })}
                  />
                ) : null}
              </div>
            );
          })}
        </fieldset>
      ) : null}

      {d.platforms.includes('youtube') ? (
        <div className={styles.field} data-tour-target="SET_YT_TITLE">
          <label className={styles.label} htmlFor="ss-yt">
            YouTube title (required for YouTube)
          </label>
          <input
            id="ss-yt"
            className={styles.input}
            value={d.ytTitle}
            aria-invalid={!d.ytTitle.trim() || undefined}
            onChange={(e) => dispatch({ type: 'SET_YT_TITLE', text: e.target.value })}
          />
        </div>
      ) : null}

      <div className={styles.actions}>
        <button type="button" className={styles.primaryBtn} onClick={() => dispatch({ type: 'SET_STAGE', stage: 'when' })}>
          Next: when
        </button>
      </div>
    </>
  );
}

function WhenStage({ s, dispatch }: ScreenProps) {
  const d = s.draft;
  const at = istToMs(d.date, d.time);
  return (
    <>
      <fieldset className={styles.field} data-tour-target="SET_WHEN">
        <legend className={styles.label}>When should it go out?</legend>
        {(
          [
            ['now', 'Post now', 'Goes out as soon as you publish.'],
            ['later', 'Schedule for later', 'Pick a date and time in India time (IST).'],
          ] as const
        ).map(([value, label, hint]) => (
          <label key={value} className={styles.radioCard}>
            <input
              type="radio"
              name="ss-when"
              value={value}
              checked={d.when === value}
              onChange={() => dispatch({ type: 'SET_WHEN', when: value })}
            />
            <span>
              <strong>{label}</strong>
              <span className={styles.muted}>{hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {d.when === 'later' ? (
        <div className={styles.dateRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ss-date">
              Date (IST)
            </label>
            <input
              id="ss-date"
              type="date"
              className={styles.input}
              value={d.date}
              onChange={(e) => dispatch({ type: 'SET_DATE', date: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ss-time">
              Time (IST)
            </label>
            <input
              id="ss-time"
              type="time"
              className={styles.input}
              value={d.time}
              onChange={(e) => dispatch({ type: 'SET_TIME', time: e.target.value })}
            />
          </div>
          {Number.isNaN(at) ? null : <p className={styles.note}>Goes live {formatIst(at)}</p>}
        </div>
      ) : null}
      <div className={styles.actions}>
        <button type="button" className={styles.ghostBtn} onClick={() => dispatch({ type: 'SET_STAGE', stage: 'write' })}>
          Back
        </button>
        <button type="button" className={styles.primaryBtn} onClick={() => dispatch({ type: 'SET_STAGE', stage: 'preview' })}>
          Next: preview
        </button>
      </div>
    </>
  );
}

function PreviewStage({ s, dispatch }: ScreenProps) {
  const d = s.draft;
  // Read the clock once when the step opens; the reducer checks again on publish.
  const [openedAt] = useState(() => Date.now());
  const blocker = publishBlocker(d, openedAt);
  const p = d.platforms.includes(d.previewTab) ? d.previewTab : d.platforms[0];
  const text = (p && d.overrides[p]) ?? d.text;
  return (
    <>
      {p ? (
        <>
          <div className={styles.segmented} role="group" aria-label="Preview for" data-tour-target="SET_PREVIEW">
            {d.platforms.map((x) => (
              <button key={x} type="button" aria-pressed={x === p} onClick={() => dispatch({ type: 'SET_PREVIEW', platform: x })}>
                {x === 'facebook' ? 'Facebook' : PLATFORM_NAME[x]}
              </button>
            ))}
          </div>
          <article className={styles.preview} data-platform={p} aria-label={`${PLATFORM_NAME[p]} preview`}>
            <header className={styles.previewHead}>
              <span className={styles.avatar} aria-hidden="true">
                DC
              </span>
              <span>
                <strong>Demo Clinic</strong>
                <span className={styles.muted}>{p === 'instagram' ? '@demo.clinic.sample' : 'Sample account'}</span>
              </span>
              <PlatformIcon platform={p} className={styles.previewIcon} />
            </header>
            {d.media ? <MediaCard card={SAMPLE.card} className={styles.previewMedia} /> : null}
            {p === 'youtube' ? <p className={styles.previewTitle}>{d.ytTitle || 'Untitled video'}</p> : null}
            <p className={styles.previewText}>{text || 'Your text appears here.'}</p>
          </article>
        </>
      ) : (
        <p className={styles.muted}>Choose a platform to see its preview.</p>
      )}
      <p className={styles.note}>
        {d.when === 'later' && !Number.isNaN(istToMs(d.date, d.time)) ? `Scheduled for ${formatIst(istToMs(d.date, d.time))}` : 'Posts as soon as you publish.'}
      </p>
      {blocker ? (
        <p id="ss-blocker" className={styles.blocker}>
          {blocker}
        </p>
      ) : null}
      <div className={styles.actions}>
        <button type="button" className={styles.ghostBtn} onClick={() => dispatch({ type: 'SET_STAGE', stage: 'when' })}>
          Back
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={!!blocker}
          aria-describedby={blocker ? 'ss-blocker' : undefined}
          onClick={() => dispatch({ type: 'PUBLISH' })}
        >
          {d.when === 'later' ? 'Schedule post' : 'Publish now'}
        </button>
      </div>
    </>
  );
}

function PublishView({ s, dispatch }: ScreenProps) {
  const { platforms, when } = s.draft;
  const done = s.publish.status === 'done';
  const verb = when === 'later' ? 'Scheduled' : 'Published';
  return (
    <div className={styles.publish}>
      <PublishRing platforms={platforms} reached={s.publish.reached} />
      <h3 className={styles.title}>{done ? `${verb} on ${platforms.length} platform${platforms.length > 1 ? 's' : ''}` : 'Sending your post'}</h3>
      <ul className={styles.reachList} aria-live="polite">
        {platforms.map((p) => {
          const on = s.publish.reached.includes(p);
          return (
            <li key={p} data-on={on}>
              <PlatformIcon platform={p} /> {PLATFORM_NAME[p]}
              <span className={styles.reachState}>{on ? verb : 'Sending'}</span>
            </li>
          );
        })}
      </ul>
      {done ? (
        <div className={styles.actions}>
          <button type="button" className={styles.ghostBtn} onClick={() => dispatch({ type: 'NAVIGATE', screen: 'create' })}>
            Create another
          </button>
          <button type="button" className={styles.primaryBtn} onClick={() => dispatch({ type: 'NAVIGATE', screen: 'home' })}>
            Go to Home
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ---- Analytics ----

const ANALYTICS: Record<Platform, { views: string; stats: [string, string][]; bars: number[] }> = {
  instagram: { views: '4,820', stats: [['Likes', '612'], ['Comments', '48'], ['Shares', '91']], bars: [42, 58, 35, 70, 64, 88, 76] },
  facebook: { views: '2,140', stats: [['Reactions', '203'], ['Comments', '22'], ['Shares', '37']], bars: [30, 26, 44, 38, 52, 41, 47] },
  youtube: { views: '6,390', stats: [['Likes', '355'], ['Comments', '31'], ['Watch hours', '74']], bars: [55, 49, 72, 61, 90, 84, 97] },
};

const COMPARE: { label: string; values: Record<Platform, string> }[] = [
  { label: 'Average views', values: { instagram: '690', facebook: '305', youtube: '913' } },
  { label: 'Engagement rate', values: { instagram: '6.2%', facebook: '3.4%', youtube: '5.1%' } },
  { label: 'Watch time', values: { instagram: '0:18', facebook: '0:12', youtube: '0:41' } },
  { label: 'Best day and time (IST)', values: { instagram: 'Tue 7 pm', facebook: 'Sun 11 am', youtube: 'Sat 6 pm' } },
];
const AVG_VIEWS: Record<Platform, number> = { instagram: 690, facebook: 305, youtube: 913 };

const TOP_POSTS = [
  { title: 'Morning mobility in 3 moves', platform: 'youtube', views: '1,840' },
  { title: 'Screen at eye level', platform: 'instagram', views: '1,210' },
  { title: 'Five-minute stretch break', platform: 'facebook', views: '640' },
] as const;

/** Static bar chart: the last seven posts' views. */
function Bars({ values }: { values: number[] }) {
  return (
    <svg viewBox="0 0 70 30" className={styles.bars} aria-hidden="true" preserveAspectRatio="none">
      {values.map((v, i) => (
        <rect key={i} x={i * 10 + 1} y={30 - (v / 100) * 30} width={7} height={(v / 100) * 30} rx={1.5} />
      ))}
    </svg>
  );
}

function AnalyticsScreen({ s, dispatch }: ScreenProps) {
  const compare = s.analyticsView === 'compare';
  return (
    <>
      <h3 className={styles.title}>Analytics</h3>
      <div className={styles.segmented} role="group" aria-label="Analytics view" data-tour-target="SET_ANALYTICS_VIEW">
        <button type="button" aria-pressed={!compare} onClick={() => dispatch({ type: 'SET_ANALYTICS_VIEW', view: 'platforms' })}>
          By platform
        </button>
        <button type="button" aria-pressed={compare} onClick={() => dispatch({ type: 'SET_ANALYTICS_VIEW', view: 'compare' })}>
          Compare platforms
        </button>
      </div>
      <p className={styles.muted}>Last 30 days, sample numbers.</p>
      {compare ? (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <td />
                {PLATFORMS.map((p) => (
                  <th key={p} scope="col">
                    <PlatformIcon platform={p} />
                    {p === 'facebook' ? 'Facebook' : PLATFORM_NAME[p]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {PLATFORMS.map((p) => (
                    <td key={p}>{row.values[p]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <figure className={styles.card}>
            <figcaption className={styles.label}>Average views per post</figcaption>
            <svg viewBox="0 0 100 30" className={styles.hbars} role="img" aria-label="Instagram 690, Facebook 305, YouTube 913">
              {PLATFORMS.map((p, i) => {
                const width = (AVG_VIEWS[p] / 1000) * 60;
                return (
                  <g key={p}>
                    <text x={0} y={i * 10 + 6}>
                      {p === 'facebook' ? 'Facebook' : PLATFORM_NAME[p]}
                    </text>
                    <rect x={24} y={i * 10 + 1.5} height={6} rx={1.5} width={width} data-platform={p} />
                    <text x={26 + width} y={i * 10 + 6}>
                      {AVG_VIEWS[p]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </figure>
          <div className={styles.card}>
            <h4 className={styles.label}>Top posts</h4>
            <ol className={styles.topList}>
              {TOP_POSTS.map((t) => (
                <li key={t.title}>
                  <PlatformIcon platform={t.platform} />
                  <span>{t.title}</span>
                  <span className={styles.muted}>{t.views} views</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      ) : (
        <div className={styles.platformCards}>
          {PLATFORMS.map((p) => (
            <article key={p} className={styles.card}>
              <h4 className={styles.cardHead}>
                <PlatformIcon platform={p} /> {PLATFORM_NAME[p]}
              </h4>
              <p className={styles.big}>
                {ANALYTICS[p].views} <span className={styles.muted}>views</span>
              </p>
              <Bars values={ANALYTICS[p].bars} />
              <dl className={styles.miniStats}>
                {ANALYTICS[p].stats.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

// ---- Read-only sample screens ----

const dayFormat = new Intl.DateTimeFormat('en-IN', { timeZone: IST, weekday: 'short', day: 'numeric', month: 'short' });

function CalendarScreen({ s }: ScreenProps) {
  const days = Array.from({ length: 7 }, (_, i) => dayFormat.format(s.base + (i - 1) * 86_400_000));
  return (
    <>
      <h3 className={styles.title}>Calendar</h3>
      <ul className={styles.list}>
        {days.map((day) => {
          const posts = s.posts.filter((p) => dayFormat.format(p.at) === day);
          return (
            <li key={day} className={styles.dayRow}>
              <strong>{day}</strong>
              <span className={styles.muted}>{posts.length ? posts.map((p) => p.title).join(', ') : 'Nothing planned'}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function PostsScreen({ s }: ScreenProps) {
  return (
    <>
      <h3 className={styles.title}>Posts</h3>
      <ul className={styles.list}>
        {[...s.posts].sort((a, b) => b.at - a.at).map((p) => (
          <li key={p.id} className={styles.postRow}>
            <MediaCard card={p.card} className={styles.thumb} />
            <span className={styles.postText}>
              <strong>{p.title}</strong>
              <span className={styles.muted}>{formatIst(p.at)}</span>
              <PlatformRow platforms={p.platforms} />
            </span>
            <span className={styles.status} data-status={p.status}>
              {p.status === 'scheduled' ? 'Scheduled' : 'Published'}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function AccountsScreen() {
  return (
    <>
      <h3 className={styles.title}>Accounts</h3>
      <ul className={styles.list}>
        {PLATFORMS.map((p) => (
          <li key={p} className={styles.accountRow}>
            <PlatformIcon platform={p} />
            <span className={styles.postText}>
              <strong>Demo Clinic</strong>
              <span className={styles.muted}>{PLATFORM_NAME[p]}, sample account</span>
            </span>
            <span className={styles.status} data-status="scheduled">
              Connected
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function SettingsScreen() {
  return (
    <>
      <h3 className={styles.title}>Settings</h3>
      <dl className={styles.settings}>
        <div>
          <dt>Workspace</dt>
          <dd>Demo Clinic</dd>
        </div>
        <div>
          <dt>Time zone</dt>
          <dd>India Standard Time (IST)</dd>
        </div>
        <div>
          <dt>Default platforms</dt>
          <dd>Instagram, Facebook Page, YouTube</dd>
        </div>
        <div>
          <dt>Notifications</dt>
          <dd>Email when a post goes live</dd>
        </div>
      </dl>
    </>
  );
}

export const SCREENS = {
  home: HomeScreen,
  create: CreateScreen,
  analytics: AnalyticsScreen,
  calendar: CalendarScreen,
  posts: PostsScreen,
  accounts: AccountsScreen,
  settings: SettingsScreen,
} satisfies Record<State['screen'], (props: ScreenProps) => ReactNode>;

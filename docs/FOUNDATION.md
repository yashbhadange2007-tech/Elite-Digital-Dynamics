# Foundation: what is built and how to code against it

Verified by the orchestrator on the committed state: `eslint .` clean, `tsc --noEmit` clean, 28 unit tests pass, `next build` passes (routes `/`, `/_not-found`, `/privacy`; no preview routes in production), Manrope loads from our own origin, zero console errors and zero off-site requests on `/` and the previews, WebGL renders in headless Chromium with the flags below, `/visit/<slug>` answers 307.

**The source is the contract.** Every file in `src/lib` and `src/components/ui` has doc comments on its exports and props. Read the file you use before you use it. This page is the map.

## Versions and gotchas
- next 16.4.6 (Turbopack), react and react-dom 19.3.1 exact, three 0.187.0, @react-three/fiber 9.8.2, maath 0.10.8, tailwindcss 4.3.5, @phosphor-icons/react 2.1.x, **typescript 6.0.3** (7.x did not work with the toolchain), vitest 5 (config is `vitest.config.mts`), @playwright/test 1.63.0 exact, @axe-core/playwright, sharp.
- Not installed and not allowed: drei, postprocessing, GSAP, Lenis, framer-motion. Only the orchestrator changes `package.json`.
- Tailwind v4 is CSS-first: no config file. Only `src/` is scanned for class names. Tokens are declared `@theme static`, so every token exists both as a utility and as `var(--token)` (usable in CSS Modules and in three.js via `getComputedStyle`).
- `next.config.ts` turns off the dev badge and builds the `/visit/<slug>` redirects from `src/components/work/sites.data.json` (array of objects; `slug` and `url` are validated, extra fields are fine). A bad slug or a non-https url fails the build.
- Icons: import each one from its own path, for example `import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight'` (works in server and client components).
- Headless WebGL needs the launch args `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist` (exported as `WEBGL_ARGS` from `playwright.config.ts`, already applied to every Playwright project). Full-page screenshots wrap after about 8192px with those flags: screenshot long pages in clips.
- Ad-hoc Node scripts: `require('playwright')` resolves the global install; a bare ESM `import 'playwright'` does not. In `.mjs` use `createRequire(import.meta.url)('playwright')`.

## Commands
| What | Command |
|---|---|
| Shared dev server (already running, do not start another) | http://localhost:3000 |
| Type-check | `pnpm exec tsc --noEmit` |
| Lint your folder | `pnpm exec eslint src/components/<area> tests/<area>.spec.ts` |
| Your unit tests | `pnpm exec vitest run src/components/<area>` (pure logic only, Node environment, files `src/**/*.test.ts`) |
| Your Playwright spec | `pnpm exec playwright test tests/<area>.spec.ts` (projects `phone` 375x812 touch, `tablet` 768x1024, `desktop` 1440x900; each run writes to its own `test-results/<area>` folder) |
| Evidence screenshot | `await page.screenshot({ path: testInfo.snapshotPath('name.png') })` goes to `tests/evidence/<spec>/name-<project>.png` (tracked in git) |

`tests/fixtures.ts`: import `test` and `expect` from it. It fails a test on console errors, page errors, failed or missing same-origin files, and requests from our page to any origin other than the three client sites and `api.web3forms.com`. Options per spec: `test.use({ extraAllowedOrigins: ['https://stub.test'] })` and `test.use({ allowedConsoleErrors: [/404/] })`. Helpers: `expectNoHorizontalOverflow(page)`, `expectNoVercelText(page)`.

## Page skeleton (frozen: do not edit `layout.tsx`, `page.tsx`, `globals.css`, `ui.css`)
`src/app/layout.tsx` renders, in order: skip links, the glow (`.page-glow-clip > .page-glow`), the scrim (`.page-scrim`), `<Nav/>`, the page, `<Footer/>`, `<JsonLd/>`, `<AppInit/>` (starts scroll tracking and the motion preference). `<html lang="en-IN" data-glass="lite" data-motion="full">`; an inline script sets `data-motion` before first paint. Metadata and viewport are re-exported from `src/components/seo/metadata.ts`.

`src/app/page.tsx` renders `<SceneLayer/>` then `<main id="main">` with the sections in order. Each area replaces the default export of its entry file and keeps the section id and pose:

| Entry file (default export) | Section id | Pose | Owner |
|---|---|---|---|
| `src/components/scene/SceneLayer.tsx` | n/a | n/a | S |
| `src/components/sections/Nav.tsx`, `Footer.tsx` (in the layout, on every page) | n/a | n/a | C |
| `src/components/sections/Hero.tsx` | `top` | `hero` | C |
| `src/components/sections/Services.tsx` | `services` | `services` | C |
| `src/components/work/Work.tsx` | `work` | `work` | P |
| `src/components/socialsync/SocialSyncShowcase.tsx` | `demo` | `demo` | D |
| `src/components/sections/Process.tsx` | `process` | `process` | C |
| `src/components/sections/Faq.tsx` | `faq` | `faq` | C |
| `src/components/contact/Contact.tsx` | `contact` | none on the section; the logo stage carries `data-pose="contact"` | E |
| `src/components/seo/metadata.ts`, `JsonLd.tsx`, `src/app/privacy/page.tsx`, `src/app/not-found.tsx` | n/a | n/a | G |

The Contact stub already contains the logo stage exactly as the contract wants it (`data-logo-stage`, `data-pose="contact"`, 168px / 220px, the 2D mark hidden with `scene-live:invisible`). E keeps that element.

Preview routes: `src/app/preview/<area>/page.preview.tsx` (areas: primitives, scene, sections, work, socialsync, contact, seo). Dev only. Each imports only its own area. Edit your own preview freely; add client helpers next to it if needed. `/preview/primitives` shows every primitive in every state: open it once.

## `src/lib`
- `site.ts`: `site` (name, `tagline`, `taglineDisplay`, `phones[]` with display and `tel:` forms, `email`, `mailto`, `whatsapp.number`, `address.lines/full/street/locality/region/country`, `siteUrl`), `waLink(text?)`, `missingLaunchInputs`. The only place business facts live.
- `services.ts`: `SERVICES` (five entries with stable `id` and exact `name`), `ServiceId`, `NOT_SURE`.
- `scroll-store.ts`: `PoseId`, `POSE_ORDER`, mutable `scrollState { y, progress, poseIndex, vh }`, `subscribeScroll(listener)` (at most once per frame, works with `useSyncExternalStore`), `startScrollTracking()` (already called by the layout), pure `computePoseIndex()` and `toPoseOrderIndex()`. Anchors are elements with `[data-pose]`, measured by their centres; `poseIndex` is a float index into `POSE_ORDER`.
- `quality-store.ts`: `Tier`, `GlassMode`, `MotionMode`, `Quality`, `getQuality()`, `getServerQuality()`, `subscribe()`, `setTier()`, `setGlass()`, `setMotion()`, `toggleMotion()`, `initMotionPreference()`, `MOTION_STORAGE_KEY`. Setters write `data-glass` / `data-motion` on `<html>`.
- `hooks.ts`: `useQuality()`, `useMediaQuery(query)`, `usePrefersReducedMotion()`, `useInView(ref, options)`.
- `fonts.ts`: `manrope` (on `<html>`, `--font-sans`), `figtree` (`preload: false`, `--font-figtree`; D applies `figtree.variable` on the demo root).
- `cn.ts`: `cn(...classes)`.

## `src/components/ui` (named exports)
`Button` (link when `href`, button otherwise; `variant` primary or ghost; `size` md or lg; `icon`; `external`; `disabled`), `GlassPanel` (`primary`, `tone` glass or flat, `as`), `Section` (`id`, `pose`, `above`, `eyebrow`, `title`, `lead`, `headingLevel`, `align`, class props; renders the stacked header and a `Container`), `Container`, `Eyebrow`, `NumberLabel` (`n`), `Heading` (`level`, `size`), `Reveal` (`stagger`; content is visible without JavaScript), `ExternalLink` (new tab, noopener, screen-reader note), `VisuallyHidden`, `DeviceFrame` (`variant` phone or laptop, `addressLabel`, children are the screen), `MotionToggle`, `SkipLinks`, `Logo` (`variant` horizontal, mark, stacked or mono; `height`; `decorative`; `loading`), `AppInit`.

## CSS contract
- Tokens: every name in DESIGN.md sections 2, 4, 5 and 9, as `var(--color-salmon)` and as utilities (`text-salmon`, `bg-ember-600`, `text-h2`, `rounded-panel`, `duration-2`, `ease-out`, `z-content`). Also `--color-white`, `--z-glow`, `--z-skip`, `--ease-in-out`.
- Variants: `motion-full:`, `motion-still:` (follow `html[data-motion]`; prefer them to `motion-safe:`), `scene-live:` (while `html[data-scene="live"]`).
- Classes: `.page-glow` (moved by `transform` only; the scene may override its transform and opacity), `.page-glow-clip`, `.page-scrim`, `.text-scrim`, `.ui-glass`, `.ui-btn`, `.ui-pill-link`, `.ui-link`, `.ui-lead`, `.ui-num`, `.ui-eyebrow`, `.ui-reveal`, `.ui-section`, `.ui-section-header`, `.visually-hidden`. Prefer the components to the raw classes.
- Glass: `html[data-glass="real"]` blurs only `GlassPanel primary` and the nav pill; everything else is lite. Never nest glass.
- State attributes on `<html>`: `data-glass` (lite or real), `data-motion` (full or still), `data-scene` (live, still or poster; absent until the scene decides; set by S).

## Deviations from ARCHITECTURE.md
- TypeScript 6.0.3 instead of 7.x.
- `vitest.config.mts` (not `.ts`).
- The glow sits inside a clipping wrapper (`.page-glow-clip`) so the 140vmax element cannot cause horizontal scroll.
- `Section` has an extra `above` slot (content above the heading), used by the logo stage.

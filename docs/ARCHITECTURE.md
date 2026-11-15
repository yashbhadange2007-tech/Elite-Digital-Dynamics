# Architecture and build contracts

Approved by the owner. Read `docs/BRIEF.md` first. Design values (colours, type, spacing, motion) live in `DESIGN.md`; content lives in `SPEC.md`.

## 0. Pins and things to re-check
- next 16.4.x, react and react-dom **19.3.1 exactly** (`@react-three/fiber` 9.8.2 requires react below 19.4), three 0.187.0, maath 0.10.8, tailwindcss 4.3.x. Package manager: pnpm.
- Playwright in this container is 1.63.0 with its browser in `/opt/pw-browsers` (`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`). Pin `@playwright/test@1.63.0`. Never run `playwright install`.
- From memory, re-check before relying on them: Next 16 renamed `middleware.ts` to `proxy.ts`, removed `next lint`, builds with Turbopack by default; Next 16 dev writes to `.next/dev` under a lock; headless Chromium needs `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist` for WebGL; Satori (OG images) does not read woff2.

## 1. Structure and ownership
Root: `/home/user/Elite-Digital-Dynamics`. One working tree. Each agent edits only the files it owns.

```
package.json  pnpm-lock.yaml  tsconfig.json  next.config.ts  postcss.config.mjs
eslint.config.mjs  playwright.config.ts  vitest.config.ts  .env.example      [F]
public/scene/poster-{mobile,desktop}.webp                                    [S]
public/work/<slug>/{mobile,desktop}-NN.webp                                  [P]
scripts/capture-poster.mjs                                                   [S]
scripts/probe-sites.mjs  capture-sites.mjs  stub-sites/{server.mjs,*.html}   [P]
scripts/capture-og.mjs  check-launch-inputs.mjs                              [G]
tests/{scene,sections,work,socialsync,contact,seo}.spec.ts                   [owner of area]
tests/helpers/{console-gate,contrast-sampler,webgl-flags}.ts                 [G]
src/fonts/Manrope-Variable.woff2  Figtree-Variable.woff2  OFL.txt            [F]
src/app/layout.tsx  globals.css  page.tsx                [F, frozen after foundation]
src/app/privacy/page.tsx  not-found.tsx  sitemap.ts  robots.ts  manifest.ts
        icon.svg  apple-icon.png  opengraph-image.png (+ .alt.txt)           [G]
src/app/preview/{primitives[F],scene[S],sections[C],work[P],socialsync[D],
        contact[E],seo[G]}/page.preview.tsx
src/lib/site.ts  services.ts  scroll-store.ts  quality-store.ts  hooks.ts  cn.ts  [F]
src/components/ui/         Button GlassPanel Section Container Eyebrow Heading
                           Reveal ExternalLink DeviceFrame VisuallyHidden    [F]
src/components/scene/      SceneLayer(entry) SceneCanvas Rings Core FrameDriver Poster
                           geometry.ts materials.ts environment.ts poses.ts
                           solver.ts quality.ts                              [S]
src/components/sections/   Nav Hero Services Process Faq Footer content.ts   [C]
src/components/work/       Work(entry) SitePreview TallFrame InteractiveFrame
                           ScreenshotFrame sites.config.ts sites.measured.json [P]
src/components/socialsync/ SocialSyncShowcase(entry) machine.ts tour.ts data.ts
                           screens/* socialsync.module.css                   [D]
src/components/contact/    Contact(entry) EnquiryForm ContactBlock
                           validation.ts submit.ts fallback.ts               [E]
src/components/seo/        JsonLd.tsx                                        [G]
```

| Agent | Owns | Preview route |
|---|---|---|
| F Foundation (serial, first) | config, `app/layout`, `globals.css`, `page.tsx`, `lib/*`, `ui/*`, fonts, entry stubs | `/preview/primitives` |
| S Scene | `components/scene/*`, posters, `capture-poster` | `/preview/scene?pose=&tier=&still=&hud=` |
| C Sections | `components/sections/*` (nav, hero, services, process, FAQ, footer, copy) | `/preview/sections` |
| P Portfolio | `components/work/*`, `public/work`, site scripts, stubs | `/preview/work?mode=` |
| D SocialSync | `components/socialsync/*` | `/preview/socialsync?frame=phone\|laptop` |
| E Form and contact | `components/contact/*` | `/preview/contact?key=demo\|none` |
| G SEO, legal, test helpers | privacy, 404, metadata files, JSON-LD, `tests/helpers`, launch check | `/preview/seo` |

### Collision rules
- Only F edits `package.json` and the lockfile. Need a package? Ask in your final report; do not install.
- `page.tsx` is written once by F. It composes the final section order from entry stubs F creates in each agent's folder with fixed default-export names. Agents replace their own stub. Nobody edits `page.tsx` again.
- One shared `next dev` server runs on **port 3000**, started by the orchestrator. Agents do NOT start another dev server, do NOT run `next build`, do NOT commit. If the server is down, say so in your report.
- Check your work only on your own `/preview/<area>` route (plus `/` for S and C). Each preview imports only its own area, so another agent's compile error cannot break yours.
- Type-check with `pnpm exec tsc --noEmit` and ignore errors in files you do not own.
- Preview routes never ship: `pageExtensions` includes `preview.tsx` only when `NODE_ENV !== 'production' || PREVIEW_ROUTES === '1'`.

### Foundation exit criteria (F finishes before anyone else starts)
1. All dependencies installed: next, react, react-dom, three, @react-three/fiber, maath, tailwindcss, @tailwindcss/postcss, clsx; dev: typescript, @types/*, @types/three, @playwright/test@1.63.0, @axe-core/playwright, sharp, vitest, eslint, eslint-config-next.
2. `page.tsx` composes the final section order from entry stubs.
3. Tokens, fonts, primitives and stores done and shown on `/preview/primitives`.
4. A one-mesh R3F canvas renders in `/preview/scene` (proves Next + React + R3F work together).
5. `pnpm build` is green.

### Shared contracts (owned by F)
- **CSS custom properties**, declared in Tailwind v4 `@theme` so they are utilities and variables:
  - colour: `--color-bg`, `--color-ember-{950..300}`, `--color-salmon`, `--color-text`, `--color-text-muted`, `--color-hairline`, `--color-focus`
  - glass: `--glass-fill`, `--glass-fill-lite`, `--glass-blur`
  - shape and motion: `--radius-panel`, `--radius-card`, `--radius-pill`, `--ease-out`, `--dur-1..3`
  - layout: `--nav-h`, `--z-scene`, `--z-scrim`, `--z-content`, `--z-nav`
- **Root attributes:** `html[data-glass="lite|real"]` (SSR default `lite`) and `html[data-motion="full|still"]`.
- **Primitives:**
  - `<Section id pose?: PoseId eyebrow? index? title lead?>` emits `data-pose`, `aria-labelledby`, `scroll-margin-top`.
  - `<GlassPanel primary? tone?>`; only `primary` panels may get real blur.
  - `<Button href|onClick variant="primary|ghost" size>` with a 44px minimum target.
  - `<Eyebrow index="01">`, `<Heading>`, `<Reveal>`, `<Container>`, `<VisuallyHidden>`.
  - `<ExternalLink>` always sets `target=_blank rel="noopener noreferrer"` plus a screen-reader "opens in new tab".
  - `<DeviceFrame variant="phone|laptop" addressLabel>` shared by P and D.
- **`lib/scroll-store.ts`:** `PoseId = 'hero'|'services'|'work'|'demo'|'process'|'faq'|'contact'`. A mutable `scrollState {y, progress, poseIndex (float), vh}` written by one passive scroll listener. `poseIndex` is the piecewise-linear position of the viewport centre between `[data-pose]` anchor centres, re-measured by ResizeObserver and on `document.fonts.ready`. No React state.
- **`lib/quality-store.ts`:** `{tier: 0|1|2|3, glass, motion}` with setters that write the root attributes. S implements the controller that drives it.
- **`lib/site.ts`:** the single registry of business facts (name, tagline, two phones, email, WhatsApp number, address, domain). Unknown values are typed placeholders; `scripts/check-launch-inputs.mjs` fails while any remain.
- **`lib/services.ts`:** the five service ids and labels, used by sections, the form select and JSON-LD.

## 2. Styling and fonts
- Tailwind v4 (CSS-first `@theme`, no config file), plus CSS Modules where a component needs real selectors or isolation (SocialSync, device frames, glass).
- Not in the shipped bundle: GSAP, Lenis, framer-motion, xstate, drei, postprocessing. Native scroll only. No scroll hijacking.
- Fonts via `next/font/local` with variable woff2 files copied once from `@fontsource-variable/manrope` and `@fontsource-variable/figtree` (OFL) into `src/fonts/` and committed. Never `next/font/google` (fetches at build time).
  - Manrope: `variable: '--font-sans'`, preloaded, on `<html>`.
  - Figtree: `preload: false`, `variable: '--font-figtree'`, applied only on the demo root.
- Headings at Manrope weight 300 (not 200; hairlines break up over the bright object), body 400/500, tabular figures for the 01/02/03 labels.

## 3. 3D scene (agent S)
- **Geometry:** `LatheGeometry` over a closed rounded-rectangle profile via `makeRing({radius, radial, axial, bevel, around, profile})`. The reference rings are flat ribbon bands with bevelled edges, not round tori. Four rings plus a core sphere; about 20k triangles and 6 draw calls at the top tier.
- **Material:**
  - Top tier `MeshPhysicalMaterial`: colour about `#5a0b0d`, metalness 1, roughness 0.2, clearcoat 1, clearcoatRoughness 0.08. Lower tiers `MeshStandardMaterial`.
  - Salmon edges come from two thin salmon-white strip lights in the environment at grazing angles, caught by the bevels, plus a small `onBeforeCompile` fresnel rim (dropped at tier 1).
  - `ACESFilmicToneMapping` pushes hot reds toward salmon; compare with `NeutralToneMapping` in the preview and keep the closer match to the reference.
  - One red `pointLight` at the core (no shadows) lights the inner faces.
- **Environment:** hand-rolled in `environment.ts`: a tiny `THREE.Scene` of 4 to 5 emissive planes (one large soft red, two salmon strips, a dim fill), `PMREMGenerator.fromScene()` once, assigned to `scene.environment`. No HDR file, no network. Regenerate on `webglcontextrestored`.
- **Core glow:** no bloom pass. Unlit HDR-red sphere, one or two additive billboard sprites with a canvas-generated radial texture (`depthWrite: false`), and a fixed CSS radial-gradient layer behind a transparent canvas for the page-wide glow.
- **Poses** (`poses.ts`, data only): per pose, group `{x, y, scale}` for mobile and desktop, `dim` (0 to 1), `fpsCap`, and per ring `{quat, offset, swayAmp, swaySpeed}`. Our arrangement, not DEVHAUS's:
  - hero: skewed gyroscope
  - services: flat concentric rings facing the camera
  - work: upright arcs rising from below
  - demo: small and dimmed
  - process: rings spread along one axis
  - faq: small gyroscope to one side
  - contact: large dim concentric halo
- **Scroll mapping** (`solver.ts`, pure, no renderer, unit-tested):
  - Smooth-damp `poseIndex` with `maath/easing.damp` (smoothTime about 0.35 s, maxSpeed about 2.5 poses/s).
  - The pose is a pure function of the smoothed value: smoothstep within each segment, `slerp` for quaternions, lerp for scalars. Motion always passes through intermediate poses; velocity stays continuous on reversal.
  - Clamp `dt` to 50 ms.
  - Idle drift is a bounded two-axis sway about in-plane axes (spin about a ring's own axis is invisible; unbounded tumbling cannot return to a flat pose without a snap). Integrate phase from speed so speed changes do not jump.
- **Pointer:** a window `pointermove` writes to a ref only under `(hover: hover) and (pointer: fine)`. Adds a damped group rotation of at most 0.12 rad. Canvas has `pointer-events: none`.
- **Frame loop:** `frameloop="demand"` with a `FrameDriver` rAF that calls `invalidate()` only when the tab is visible, motion is `full`, and tier > 0. Skips alternate frames at tier 1 or when the pose's `fpsCap` is 30.
- **Canvas box:** `position: fixed; height: 100lvh; contain: strict`. Debounce resize so the mobile URL bar does not reallocate the buffer.
- **Quality tiers:**

| Tier | dpr cap | Lathe segments | Material | Rate | Glass |
|---|---|---|---|---|---|
| 3 | min(dpr, 2) | 160 x 28 | Physical + clearcoat + rim | every frame | real |
| 2 | 1.5 | 96 x 20 | Standard + rim | every frame | lite (promote to real only with sustained headroom) |
| 1 | 1.0 | 64 x 14 | Standard, one halo | every 2nd frame | lite |
| 0 | n/a | n/a | loop stopped, last frame or poster | n/a | lite |

- **Quality controller:**
  - Start at tier 3 on desktop, 2 on coarse pointers, 1 if `deviceMemory <= 2` or Save-Data.
  - Monitor the median of a 90-frame window, ignoring 45 frames after mount, resume or a tier change, and any delta over 250 ms.
  - Step down after two consecutive windows above 24 ms. Step up only after 8 s below 17.5 ms, at most twice per session, then lock.
  - Downgrades cheapest-first: dpr, half rate, material, geometry.
  - Tier 0 only below 20 fps, so iOS low-power mode (30 Hz rAF) settles at tier 1.
- **Reduced motion and Pause:** `prefers-reduced-motion` and a visible "Pause motion" toggle both set `motion=still`: one rendered frame of the current pose, re-rendered on resize only. Persist the toggle in localStorage (WCAG 2.2.2).
- **No WebGL:** `SceneLayer` probes `getContext('webgl2'|'webgl')` before importing three. It shows `<Poster>` on no context, on a software renderer string (SwiftShader/llvmpipe; overridable with `?scene=force` for tests in this GPU-less container), on Save-Data, and on context loss. Posters are produced by `scripts/capture-poster.mjs` (Playwright opens `/preview/scene?pose=hero&still=1&scene=force`, waits for `window.__scene.ready`, element screenshot with `omitBackground`, `sharp` writes two alpha WebPs). Commit them.
- **Loading:** `SceneLayer` is a client component mounted in `page.tsx` only (`/privacy` and the 404 get the CSS glow alone). After first paint it waits for `requestIdleCallback` (timeout 2 s, `setTimeout` fallback), probes, then loads `dynamic(() => import('./SceneCanvas'), {ssr: false})`. The canvas fades in on its first frame. The LCP element stays the hero heading.
- **Debug hooks:** `window.__scene = {ready, frames, tier, info}` and a `?hud=1` overlay (tier, dpr, p50/p95 frame time, glass mode) so the owner can check on a real phone.
- **`backdrop-filter` cost:** every blurred panel over a canvas that repaints each frame is re-blurred each frame. Rules:
  1. Default `lite` glass: 0.72 to 0.82 opaque fill, hairline, inner highlight, no blur. `real` at tier 3; demote if frames slip.
  2. At most the nav pill and one `primary` panel blur at a time. Never nest blurs; never on cards.
  3. In lite mode, fake the frost on the scene side: pose `dim` plus lower dpr while panels cover the object.
  4. Never animate transform or opacity of a blurred element.
- **Readability:** the object is offset away from text per breakpoint; a CSS scrim layer sits between canvas and content; fill opacity chosen so muted text passes AA against the brightest salmon behind it. The contrast sampler test enforces this.

## 4. Portfolio frames (agent P)
- **Config** (`sites.config.ts`): each entry `{slug, name, addressLabel, caption, url, mode: 'tall'|'interactive'|'screenshot', virtual: {phone: 390, laptop: 1280}, height: {phone, laptop}, footerColor, shots}`. `SitePreview` switches on `mode`; `?mode=` overrides it in the preview route.
- **Tall mode:**
  - Iframe at a fixed virtual width (390 in the phone frame, 1280 in the laptop frame), scaled with `transform: scale()` to the frame width (ResizeObserver sets `--s`).
  - Height measured once, at authoring time, by `probe-sites.mjs` (Playwright can read `scrollHeight` inside cross-origin frames) and stored in `sites.measured.json`, plus 2% slack painted in `footerColor`.
  - The iframe gets `pointer-events: none`, `tabIndex={-1}`, `inert` and a title.
  - Our scroller is a focusable `role="region"`, at most `min(70svh, 560px)` tall, `overscroll-behavior: auto` (never `contain`), `touch-action: pan-y`.
  - A transparent anchor covers the full content height inside the scroller, so drag scrolls and tap opens. It is `aria-hidden` and `tabIndex=-1`; a visible "Open live site" button is the accessible link.
- **Links:** routed through `redirects()` in `next.config.ts` (`/visit/<slug>` to the real URL, non-permanent), so neither page text nor the browser status bar shows `.vercel.app`. (P reports the redirect entries; F's `next.config.ts` reads them from `src/components/work/sites.config.ts` or a small JSON so P never edits `next.config.ts`.)
- **Sandbox:** `sandbox="allow-scripts allow-same-origin"`; no top-navigation, popups, forms or modals. `referrerpolicy="strict-origin-when-cross-origin"`.
- **Fallback A (`interactive`):** normal-height iframe with pointer events on, same sandbox, plus the "Open live site" button.
- **Fallback B (`screenshot`):** tiled full-page WebPs (each tile at most 4096px tall, lazy) inside the same scroller.
- **Never empty:** the first screenshot tile is always the skeleton under the iframe. If `load` has not fired in 8 s, the component stays on the screenshots.
- **Lazy mount:** IntersectionObserver with a 600px rootMargin; unmount when far away on small screens.
- **Verifying the mode per site** (`probe-sites.mjs`):
  1. Read `X-Frame-Options` and `frame-ancestors` on every redirect hop. A refusal means `screenshot`.
  2. Measure `scrollHeight` at an 800px-high iframe, set the iframe to that height, re-measure. Growth above 3% means vh-sized sections stretch, so `interactive`.
  3. Screenshot at 375 and 1440 and inspect for pinned or scroll-linked sections stuck at their start state.
  4. Record heights and the redirect hosts needed for `frame-src`.
- **Stubs:** `scripts/stub-sites` (three local long pages: one with `100vh` sections, one sending `X-Frame-Options: DENY`, one attempting `top.location`) for deterministic tests.

## 5. SocialSync demo (agent D)
- **State:** plain `useReducer` in `machine.ts`: `{mode: 'tour'|'manual', screen, draft{media, platforms, text, overrides, ytTitle, when}, publish{status, reached[]}, posts, analyticsView}`. `canPublish` is derived (needs a platform and text, and a YouTube title when YouTube is selected).
- **Guided loop:** `tour.ts` is a script of `{delay, action}` dispatching the same actions the UI does: create, pick platforms, chunked typing, schedule in IST, preview, publish with `PLATFORM_REACHED` per platform, home with countdown, analytics, compare, reset. One `setTimeout` at a time.
- **Manual control:** any pointerdown or keydown inside dispatches `TAKE_CONTROL`. A visible Pause/Resume-tour control (WCAG 2.2.2).
- **Scoping:** root has the Figtree variable class, a CSS-Module class, `color-scheme: light`, `isolation: isolate`, `contain: layout paint style`, and only `--ss-*` tokens. No global ember tokens inside.
- **Layout:** a container query on the device screen picks sidebar (720px and wider) or bottom tabs. Mount one instance: phone on mobile, laptop with a phone/laptop toggle on desktop.
- **Label:** "Sample data, nothing is posted" visible on every screen. Credit "Built for IPMH, Pune".
- **Extra screens:** Calendar, Posts, Accounts, Settings are simple read-only sample screens.
- **Main-thread budget:** loaded with `next/dynamic` when within 600px, over a server-rendered skeleton with reserved size. CSS transform and opacity animation only; ring is SVG `stroke-dashoffset`; charts are static inline SVG; countdown ticks once per second; times via `Intl.DateTimeFormat('en-IN', {timeZone: 'Asia/Kolkata'})` with the next-post time relative to mount.
- **Pauses when:** under 25% in view, `document.hidden`, focus inside, manual mode, or reduced motion (no autoplay; click-through only).
- Sample content must be neutral and must not read as IPMH's real numbers or real handles.

## 6. Enquiry form (agent E)
- **Web3Forms** (confirm against `docs/research/web3forms.md`): client-side `POST https://api.web3forms.com/submit`, JSON, body `{access_key, subject, from_name, name, phone, email, business, service, message, botcheck}`, response `{success, message}`.
- **Component:** `<EnquiryForm accessKey={process.env.NEXT_PUBLIC_WEB3FORMS_KEY}>`; the key as a prop lets the preview route test both modes.
- **Fields:** name (required, `autocomplete="name"`), phone (required, `type="tel"`), email (optional, validated if present), business (`autocomplete="organization"`), service (native `<select>`: five services plus "Not sure yet"), message (up to 2000 characters).
- **Phone rule:** strip spaces and `-().`; strip leading `+91`, `0091`, or `91` when 12 digits remain; if 11 digits with leading `0` and second digit 6 to 9, strip the `0`; accept `/^[6-9]\d{9}$/` and an 11-digit `0`-prefixed landline; reject ten identical digits; send as `+91XXXXXXXXXX`.
- **No key:** says so up front ("This opens WhatsApp or your email app with your details filled in. Nothing is sent until you press send there."). Two actions called synchronously in the handler: `https://wa.me/91…?text=` and `mailto:` (body trimmed to about 1800 characters). Afterwards it says "opened", never "sent". The same two options appear on any Web3Forms failure or a 12 s timeout, with entered data kept.
- **Spam:** off-screen `botcheck` checkbox (`aria-hidden`, `tabIndex=-1`) and a 2.5 s time trap; either returns a silent fake success without a request.
- **Accessibility:** `noValidate`; validate on submit, then on blur; `aria-invalid` and `aria-describedby` per field; failed submit focuses the first invalid field and fills a `role="alert"` summary; success replaces the form with a `role="status"` panel whose heading takes focus; pending button `aria-disabled`.
- **Contact block:** `tel:` links for both numbers, `mailto:`, WhatsApp button, `<address>`, all from `lib/site.ts`.

## 7. Security headers (security pass, edits `next.config.ts` only)
Static policy in `headers()` (a nonce would force every page dynamic):
```
default-src 'self';
script-src 'self' 'unsafe-inline';            (dev adds 'unsafe-eval')
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self';
connect-src 'self' https://api.web3forms.com; (dev adds ws://localhost:*)
frame-src <the client site origins from the probe>;
worker-src 'self' blob:;  media-src 'self';  manifest-src 'self';
object-src 'none';  base-uri 'self';  form-action 'self';
frame-ancestors 'none';  upgrade-insecure-requests
```
Plus HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, a `Permissions-Policy` denying camera, microphone, geolocation, payment and sensors, `Cross-Origin-Opener-Policy: same-origin`. No COEP (breaks the iframes). Vercel preview deployments inject `vercel.live`; allow it only when `VERCEL_ENV === 'preview'`.

## 8. Verification
- `playwright.config.ts` has no `webServer`; it uses `BASE_URL` (default `http://localhost:3000`). Projects: 375x812 (touch), 768x1024, 1440x900. Chromium args as in section 0.
- Gates on every spec: no console errors, no `pageerror`, no `securitypolicyviolation`; every request same-origin except the frame hosts and Web3Forms; no horizontal overflow; `innerText`, `aria-label`, `title` and `alt` never contain `.vercel.app`.
- Accessibility: axe at WCAG 2.1 AA; a contrast sampler for text over the canvas (hide the text colour, screenshot behind it, require 4.5, or 3 for large text) at quarter-viewport scroll steps in both glass modes; keyboard walk.
- Scene: vitest on `solver.ts` at fixed dt with step jumps and reversals (bounded angular velocity and acceleration); controller tests with a mock clock; browser checks for reduced motion (frame counter constant), no-WebGL (poster, three chunk never requested), context loss, hidden tab.
- Frame times in this container are software rendering. They support: relative cost between tiers, JS time per frame under 4x CPU throttling, draw-call and triangle budgets, and that the controller walks down under load. They do not support any claim about a real phone GPU.
- Form: `page.route` mocks for 200, 4xx, 429, abort and timeout, in both key modes.
- Production gate (orchestrator): eslint, `tsc --noEmit`, `vitest run`, `check-launch-inputs`, `next build`, `next start`, the suite against the build, header assertions, grep of `.next/static` for `googleapis|gstatic|unpkg|jsdelivr`.
- Copy scan: no testimonials, counts, years, awards, prices; no fake, paid or filtered wording in the review service.

## 9. Owner changes after approval (these override anything above)

1. **Brand assets** are in `public/brand/`: `edd-lockup-horizontal.svg` (nav, desktop), `edd-mark.svg` (nav, phones), `edd-lockup-stacked.svg` (footer), `edd-favicon.svg` (favicon / app icon source), `edd-app-icon.svg` + `edd-mark.svg` (apple icon, manifest icons, share image), `edd-mark-mono.svg` (`currentColor`, one-colour needs; derived from the mark because it was missing from the upload). The wordmark is outlined Manrope. Always keep real text "Elite Digital Dynamics" next to or under the logo for screen readers and SEO. G builds `src/app/icon.svg` from the favicon file and PNG icons with `sharp`.
2. **The mark is the hero object in 2D.** The scene's two main rings are the logo's two rings: outer ring A and inner ring B, each an open band with a gap and round ends, turning in opposite directions around the glowing core. Geometry and colours are in `DESIGN.md` section 9. No other rings: the owner defined the object as the mark (two rings and a core). If the hero looks sparse next to the reference at the checkpoint, the owner decides whether to add more.
3. **Contact pose = the logo, exactly.** Replace "large dim concentric halo": A and B face the viewer, coplanar, outer gap at top-right, inner gap at bottom-left, core glowing with its hot spot up-left, turning stopped, sway near zero. It should overlay `edd-mark.svg` when compared. This is the brand moment at the end of the page.
4. **Spin is now visible** (the gaps show it), so section 3's "spin about a ring's own axis is invisible" no longer holds. The solver treats in-plane spin as its own channel: phase integrates from a per-pose spin speed (A and B opposite signs); when a pose has spin speed 0 (contact), the phase eases to the nearest full turn, so the rings arrive at the logo angles with no snap and no unwinding. Unit-test this: after any scroll history, at rest in the contact pose, A's gap centre is at 45deg and B's at 225deg within 0.5deg.
5. **Open rings need end caps.** Sweep the bevelled band profile along the arc (lathe with `phiStart`/`phiLength`) and close both ends with rounded caps (half-revolve of the profile or a matching cap mesh), so no hollow ends show. Flat annular bands (wide radially, thin axially) for A and B so they read as the logo when facing the viewer.
6. **Glow:** no bloom by default. `DESIGN.md` section 3 defines `.page-glow` (one element moved by `transform` only; F creates it in `layout.tsx` with a static default position, S moves it to follow the object) and `.page-scrim`. If the side-by-side with the reference shows the glow clearly weaker, S may add one cheap half-resolution bloom pass at tier 3 on desktop only (hand-rolled or three's `UnrealBloomPass` from `three/examples/jsm`, no new package) and must report its frame cost.
7. **Web3Forms is later.** E builds both modes but the site ships in no-key mode (WhatsApp / email). Key mode is tested only with mocked responses. Do not send anything to the Web3Forms API.
8. **Icons:** `@phosphor-icons/react` is an allowed dependency (F installs). Import icons individually from `@phosphor-icons/react/dist/ssr` in server components.
9. **Work section layout** (`DESIGN.md` section 8): phones show a segmented control and ONE phone frame (only the selected iframe is mounted); desktop shows an asymmetric trio (one laptop frame, two phone frames).
10. **No per-service contact links.** One label per intent ("Start a project", "See our work", "Open live site").
11. **TypeScript:** npm `latest` is 7.x. If Next 16.4 or the tooling does not work cleanly with it, F pins the newest 5.x/6.x that does and says so.
12. **Git:** only the orchestrator commits and pushes (one push attempt per milestone).
13. **Logo stage (contract between E and S).** The Contact section renders one empty square element with `data-logo-stage` and `data-pose="contact"` (168px on phones, 220px from 1024px; the Contact `<Section>` itself carries no `pose`). The pose anchor for `contact` is therefore the stage, not the section: the rings are fully settled when the stage is at the middle of the screen. In the contact pose the scene places the logo on the stage's on-screen centre and tracks it as the page scrolls (cache the stage's document rect on resize; do not read layout every frame), scaled so the mark fills the stage the way `edd-mark.svg` fills its 64-unit box. Inside the stage E puts the 2D mark (`/brand/edd-mark.svg`) as the fallback, hidden only while `html[data-scene="live"]`.
14. **Scene state attribute.** S sets `html[data-scene]` to `live` (animated canvas), `still` (one frozen frame) or `poster` (static image); absent means not loaded yet. In `still` and `poster` the scene layer stops being a fixed full-page background and becomes a picture in the hero: `position: absolute; top: 0; height: 100lvh`, showing the hero pose, so it scrolls away with the hero and never sits behind later sections. The CSS glow stays where it is. `still` is used for `prefers-reduced-motion` and the Pause motion control; `poster` when WebGL is missing or slow, on Save-Data and after context loss.
15. **Simplifications (karpathy-guidelines: nothing speculative). These replace the more elaborate versions above.**
    - Material: start with ONE `MeshStandardMaterial` plus the fresnel rim for every tier. Add `MeshPhysicalMaterial` clearcoat at tier 3 only if a side-by-side with the reference is clearly better with it, and then show there is no visible pop when the tier changes.
    - WebGL probe: create the test context with `failIfMajorPerformanceCaveat: true` (unless `?scene=force`). No renderer-string sniffing.
    - Quality controller: tiers only step DOWN (two consecutive slow windows). No step-up. Start at tier 3 on fine pointers, tier 2 on coarse pointers, tier 1 when `deviceMemory <= 2`. Save-Data gets the poster. Glass: `real` from the start at tier 3 on fine pointers; on coarse pointers start `lite`, promote to `real` once after 6 s of healthy frames, and demote for good if frames slip.
    - SocialSync: phone frame below 1024px, laptop frame from 1024px. No frame toggle.
    - Nav: no scroll-spy / current-section highlight.
    - Portfolio config: everything about a site lives in `src/components/work/sites.data.json` (slug, url, name, addressLabel, caption, mode per device, measured heights, footerColor, shots). `sites.config.ts` only types and re-exports it. No separate `sites.measured.json`.
    - No launch-check script: `.env.example` and the final report list the inputs the owner still owes (domain, form key).
    - Tests: each area owner leaves one `tests/<area>.spec.ts` that imports `test` and `expect` from `tests/fixtures.ts` (written by the orchestrator: fails a test on console errors, page errors, failed or off-site requests, and visible ".vercel.app" text). The contrast-over-canvas sampler and the cross-site suite belong to Phase 4, not to G.
    - G owns: privacy page, 404, metadata, icons, share image, sitemap, robots, manifest and JSON-LD. Not test helpers.
16. **Lazy cuts (ponytail: the best code is the code never written).** File lists in this document are a ceiling, not a target. Portfolio tests fake awkward, refusing and hostile pages with Playwright route fulfilment on made-up hosts: no stub server and no probe script in the repo. Icons: `icon.svg`, `apple-icon.png`, manifest 192 and 512 only (no `.ico`, no maskable). One share image file. Form spam protection is the honeypot only, and only in key mode: no time trap, because silently dropping a fast real visitor loses a lead.

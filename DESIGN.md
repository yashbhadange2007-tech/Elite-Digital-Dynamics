# DESIGN: Elite Digital Dynamics

The single file every build takes values from. **Re-themed November 2026:** the red theme and the WebGL rings are gone; the video sculpture and the navy, blue and pink palette below replace them. Words and structure are in `SPEC.md`; contracts in `docs/ARCHITECTURE.md`. Written in order with build-premium-website, ui-ux-pro-max and design-taste-frontend.

## 1. Intent
- **Design read:** business owners on phones and laptops; dark, calm, exact; medium density; one moving object carries all the motion; UI is hairline-blue glass in the sculpture's own navy.
- **The sculpture is the identity.** Dark gunmetal rings with thin pink edge lines around a glowing blue core, on near-black navy. It is pre-rendered video (`source-media/`), not real-time 3D. Every colour below was sampled from its frames so the UI and the sculpture read as one world.
- **60 / 30 / 10.** About 60% of any screen is navy background, about 30% is electric blue (glows, borders, labels), white is the text. Hot pink is the remaining sliver and it means one thing: **you can tap this**.
- Restraint over decoration: the sculpture is the only spectacle. Sections get a quiet reveal and nothing more.

## 2. Colour tokens

Sampled from the sculpture frames: frame edge `#01070C` to `#050F18`, nebula `#0E294B`, ring gunmetal `#263641`, core `#48A7F0` with a `#C9FCFB` hot spot, pink edge line `#E68BCB`.

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#05070D` | page background (near-black navy, never `#000`) |
| `--color-navy-950` | `#080C17` | deepest tinted surface: device bezels, menu sheet, skip links |
| `--color-navy-900` | `#0B1526` | pressed and hover surfaces, error box fill |
| `--color-navy-800` | `#0E2240` | glow outer (the nebula) |
| `--color-navy-700` | `#14325A` | glow mid |
| `--color-blue-600` | `#1C86D6` | deep electric blue: logo ring shadow side |
| `--color-blue` | `#38B6FF` | **electric blue**: glows, active borders, icons, selection |
| `--color-blue-300` | `#8FD4FF` | blue as text: eyebrows, number labels, small notes |
| `--color-pink` | `#FF2E93` | **only things you tap**: primary button fill, text links, the selected chip, field focus border |
| `--color-pink-hover` | `#FF5CAB` | primary button hover |
| `--color-on-pink` | `#05070D` | text and icons on a pink fill |
| `--color-text` | `#FFFFFF` | headings and body |
| `--color-text-muted` | `#B6C2D6` | secondary text |
| `--color-hairline` | `rgb(143 212 255 / 0.14)` | panel and row borders |
| `--color-hairline-strong` | `rgb(56 182 255 / 0.45)` | nav pill, ghost button, active borders |
| `--color-focus` | `#FFFFFF` | focus ring |
| `--color-error` | `#FFC46B` | error text and border (always with an icon and words) |
| `--color-success` | `#7FE3C0` | success text and icon only |
| `--glass-fill` | `rgb(9 18 34 / 0.72)` | real glass (with blur); raised from 0.62 after the contrast sampler measured a pink link at 4.36 |
| `--glass-fill-lite` | `rgb(8 14 27 / 0.8)` | lite glass (no blur): still translucent, the sculpture shows through |
| `--glass-blur` | `20px` | real glass only |
| `--field-fill` | `rgb(143 212 255 / 0.05)` | form fields |
| `--field-border` | `rgb(143 212 255 / 0.22)` | form fields |

There is no red, ember or salmon anywhere. Errors are amber so they can never be mistaken for a pink tap target.

Contrast (WCAG, computed):

| Pair | Ratio | Needs |
|---|---|---|
| `--color-text` on `--color-bg` | 20.1 | 4.5 |
| `--color-text-muted` on `--color-bg` | 11.2 | 4.5 |
| `--color-blue-300` on `--color-bg` | 12.5 | 4.5 |
| `--color-pink` (link text) on `--color-bg` | 5.8 | 4.5 |
| `--color-on-pink` on `--color-pink` (button) | 5.8 | 4.5 |
| `--color-on-pink` on `--color-pink-hover` | 7.1 | 4.5 |
| white on `--color-pink` | 3.5 | **fails**, which is why button text is navy |
| `--color-focus` against bg / against the pink button | 21 / 3.5 | 3 |
| `--color-error` / `--color-success` on bg | 12.8 / 13.1 | 4.5 |
| `--color-text-muted` on lite glass over the core hot spot at sculpture opacity 0.35 | 9.2 | 4.5 |
| `--color-pink` link on lite glass over the core hot spot at opacity 0.35 / 0.25 | 4.8 / 5.1 | 4.5 |
| bare `--color-text-muted` over the core hot spot at opacity 0.25 | 5.6 | 4.5 |

**Rules that keep text readable over the sculpture.** The sculpture runs at full strength only in the hero, where text sits on the dark side of the frame over a text scrim. Behind every other section its layer opacity is at most **0.3** on desktop and **0.25** on phones. The contrast-sampler test on real screenshots is the judge. If it fails, lower the layer opacity first, then raise the glass alpha; never change the text colour.

**Pink discipline.** Pink is never a border on something inert, never an icon colour, never a glow. If it is pink, it is a link or a button. The sculpture's own pink edge lines and the intro's 0.4 s sweep line are the only exceptions: they are the brand object, not UI.

## 3. Glow and scrim (CSS layers behind content)
Stack, back to front: `--z-glow` 0, `--z-sculpture` 1, `--z-scrim` 2, `--z-content` 10, `--z-nav` 50, skip links 100, intro 200.

- **Glow** (`.page-glow`): one fixed element, `140vmax` square, static (nothing moves it), sitting behind the sculpture as its nebula:
  `background: radial-gradient(closest-side, rgb(56 182 255 / 0.16) 0%, rgb(20 50 90 / 0.3) 32%, rgb(14 34 64 / 0.16) 58%, transparent 78%)`.
  Position: phone centre `50% 62%`, desktop `66% 48%`; top-right on the privacy and 404 pages.
- **Scrim** (`.page-scrim`): fixed, `pointer-events: none`:
  `linear-gradient(180deg, rgb(5 7 13 / 0.66) 0, transparent 16%, transparent 82%, rgb(5 7 13 / 0.6) 100%)`.
- **Text scrim** (`.text-scrim`, on any text block that sits over the sculpture without a panel): `radial-gradient(closest-side, rgb(5 7 13 / 0.72), transparent)` on a pseudo-element extending `-12%` beyond the block.

## 4. Type
One family: **Manrope variable**, self-hosted (`--font-sans`). The logo wordmark is outlined Manrope, so the site and the logo match. Figtree is used only inside the SocialSync demo.

| Token | Value | Weight | Line height | Tracking |
|---|---|---|---|---|
| `--text-display` | `clamp(2.375rem, 1.6rem + 3.4vw, 4.25rem)` (38 to 68px) | 300 | 1.05 | -0.03em |
| `--text-h2` | `clamp(1.75rem, 1.3rem + 2vw, 3rem)` (28 to 48px) | 300 | 1.1 | -0.025em |
| `--text-h3` | `clamp(1.25rem, 1.1rem + 0.6vw, 1.625rem)` (20 to 26px) | 400 | 1.25 | -0.01em |
| `--text-lead` | `clamp(1.0625rem, 1rem + 0.35vw, 1.25rem)` (17 to 20px) | 400 | 1.5 | 0 |
| `--text-body` | `1rem` | 400 | 1.6 | 0 |
| `--text-small` | `0.875rem` | 400 | 1.5 | 0 |
| `--text-eyebrow` | `0.8125rem` | 500 | 1.3 | 0.04em |

- Hero h1: at most 2 lines at 1440, at most 4 at 360. Text column max `44rem`. If it breaks to 3 lines on desktop, lower the size, do not cut words.
- Body and lead max width `62ch`. Headings use `text-wrap: balance`; paragraphs `text-wrap: pretty`.
- Number labels (01 to 05): `--text-eyebrow` size, weight 500, `font-variant-numeric: tabular-nums`, colour `--color-blue-300`.
- Eyebrows: sentence case, not uppercase, colour `--color-blue-300`. Only two on the home page (hero, SocialSync).
- Emphasis inside a heading: weight 500 of the same face. No gradient text, no second typeface, no italics.
- Buttons and labels: weight 500. Nothing below 13px.

## 5. Space, shape, layers
- Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Tokens `--space-1` to `--space-10`.
- Section padding-block: `clamp(4.5rem, 3rem + 7vw, 8.5rem)`. Hero top padding: nav height + `clamp(2rem, 6vw, 5rem)` (never more than 6rem above the eyebrow on desktop).
- Container: max `75rem` (1200px); gutter `clamp(1rem, 5vw, 2.5rem)`.
- Radii (one documented rule, used everywhere): `--radius-panel: clamp(1.25rem, 1rem + 1vw, 1.75rem)` for glass panels and device frames; `--radius-card: 0.875rem` for fields, rows and inner tiles; `--radius-pill: 999px` for every button, chip and the nav.
- `--nav-h`: `4rem` phone, `4.5rem` from 1024px.
- Touch targets at least 44x44px with 8px between neighbours.
- Breakpoints: `sm 480`, `md 768`, `lg 1024`, `xl 1280`. Design phone-first at 360 to 430.

## 6. Glass panel recipe
| | Real (`html[data-glass="real"]`, `primary` panels and nav only) | Lite (default, and every non-primary panel) |
|---|---|---|
| Fill | `--glass-fill` | `--glass-fill-lite` |
| Blur | `backdrop-filter: blur(20px) saturate(1.2)` | none |
| Border | `1px solid var(--color-hairline)` | same |
| Inner highlight | `inset 0 1px 0 rgb(143 212 255 / 0.1)` | same |
| Top sheen | `linear-gradient(180deg, rgb(143 212 255 / 0.06), transparent 38%)` overlay | same |
| Shadow | `0 24px 60px -24px rgb(1 3 8 / 0.8)` | same |

Real glass is decided once at start-up, not by a frame-rate controller: `real` on a wide screen with a mouse (`min-width: 64rem`, `hover: hover`, `pointer: fine`) where `backdrop-filter` is supported, `lite` everywhere else. Phones always get lite glass: translucent fill, no blur, because a blur over a playing video costs frames there.

Blur budget: at most the nav pill and **one** `primary` panel blur in any viewport. Never nest glass in glass. Never animate transform or opacity of a blurred element. Cards inside a panel are flat (`rgb(143 212 255 / 0.04)` fill, hairline), not glass. Fallback where `backdrop-filter` is unsupported: lite.

## 7. Components

**Button** (pill, weight 500, `1rem`, one line always)
- Sizes: `md` 44px high, padding-inline 20px; `lg` 52px high, padding-inline 26px.
- Primary: fill `--color-pink`, text `--color-on-pink` (navy, weight 600), `inset 0 1px 0 rgb(255 255 255 / 0.35)`. Hover: `--color-pink-hover`. Active: `scale(0.98)`. A trailing arrow icon moves 2px on hover.
- Ghost: transparent, border `--color-hairline-strong` (blue), text `--color-text`. Hover: fill `rgb(56 182 255 / 0.1)`. A ghost button is the one tappable thing that is not pink: the blue border marks it as secondary.
- Text link (`.ui-link`, card actions): `--color-pink`, underlined in running text.
- Focus (all interactive elements): `outline: 2px solid var(--color-focus); outline-offset: 3px`.
- Disabled or pending: opacity 0.55, `aria-disabled`, no hover.

**Nav**
- Sticky, transparent at the top of the page. After 24px of scroll the links and button sit in one glass pill (the nav's blur).
- Desktop: lockup left (height 32px), four links centre-right (pill hit areas, 44px high, muted text; white with a blue hairline border on hover and focus), primary button `md` right. One line at 1024.
- Phone: mark only (36px), primary button `md`, menu button (44px, icon). Menu is a full-width glass sheet under the nav with the four links (56px rows), then Call and WhatsApp. Closes on link tap, Escape and outside tap. Use native `popover` or `<dialog>` semantics.

**Section header**: h2, then lead under it (stacked, left aligned, never headline-left / paragraph-right). Space below: 48px phone, 64px desktop.

**Number label + item** (services, steps): label `01` in `--color-blue-300` above or left of the item title (h3). Rows separated by one hairline (bottom border only, none on the last).

**Device frames** (`DeviceFrame`)
- Phone: width `min(100%, 20.5rem)`, outer radius 36px, bezel `navy-950` with hairline, 8px bezel padding, screen radius 28px. Top bar 36px: lock icon + business name in `--text-small`, centred, muted. Screen scroller height `min(70svh, 560px)`.
- Laptop: screen frame radius 16px, top bar 40px with the business name in a centred pill (`rgb(255 255 255 / 0.06)`), then the screen (aspect 16:10, scroller inside), then a 10px base lip wider than the screen by 6% with rounded bottom corners.
- No fake traffic-light dots. The address shows the business name, never a URL.
- Under each frame: site name (h3), caption (muted), ghost button "Open live site" with arrow-up-right icon.

**FAQ**: native `<details name="faq">` (one open at a time), summary row 64px min height with the question in h3 size and a plus icon that rotates 45deg when open; answer in muted body text, max `58ch`. One hairline between items.

**Form fields**: label above (`--text-small`, weight 500, `--color-text`), field 52px high (textarea min 128px), fill `--field-fill`, border `--field-border`, radius `--radius-card`, padding-inline 16px, text `--color-text`, 16px font (prevents iOS zoom). Hover border `rgb(255 255 255 / 0.28)`. Focus: border `--color-pink` plus the focus outline. Error: border `--color-error`, message below in `--color-error` with a warning icon. Helper text muted, `--text-small`. Native `<select>` with `color-scheme: dark` and a caret icon. No placeholder used as a label.

**Contact block**: a flat list (not cards): icon, label, value. Phone numbers and email are large tap targets (56px rows). WhatsApp is a ghost button with the WhatsApp icon.

**Footer**: stacked lockup (height 120px phone, 150px desktop) left; links and contact in two columns right; bottom row with the copyright line, Privacy link and the Pause motion control. Hairline on top. No glass.

**Icons**: `@phosphor-icons/react` (regular weight, 20px; 24px in the contact block). No hand-drawn icons, no emoji. Brand SVGs come from `public/brand/`. The SocialSync logo is drawn from the paths in the brief.

**Logo use**
- Nav desktop: `edd-lockup-horizontal.svg`; nav phone: `edd-mark.svg`; footer: `edd-lockup-stacked.svg`; favicon: `edd-favicon.svg`; apple icon, manifest icons and share image: built from `edd-app-icon.svg` and `edd-mark.svg`; one-colour needs: `edd-mark-mono.svg` (`currentColor`).
- Always render with visible or visually-hidden text "Elite Digital Dynamics" next to it; the image itself gets empty alt when the text is adjacent.

## 8. Layout per section (seven different families, none repeated)

| Section | Phone (360 to 430) | Desktop (1440) |
|---|---|---|
| Hero | Text block at top, left aligned, over a text scrim: eyebrow, h1, one line, then the pink "Start a project" button and the WhatsApp ghost button (full width and stacked where they do not fit one row), then a "See our work" text link. The sculpture sits under the text, about 90% of the screen wide, its top edge fading into the text. Everything is on the first screen (`min-height: 100svh`). | Text left, 7 of 12 columns, vertically centred slightly high; sculpture right of centre, large, on the frame's own dark left side. Buttons and the link in one row. |
| Services | One `primary` glass panel holding a numbered index: each service is a row (number, name, promise, three deliverables as a plain list). All rows open; no accordion. | Same single panel, 12 columns: number (1 col), name + promise (5 cols), deliverables (6 cols, in one row of three short lines). Not cards, not three equal columns. |
| Work: client sites | Segmented control with the three business names (pill tabs, horizontally scrollable if needed); **one** phone frame shown for the selected site; name, caption and "Open live site" under it. Only the selected iframe is mounted. | Asymmetric trio in one row: laptop frame (about 58% width) for the first site and two phone frames for the others, bottoms aligned. No glass panel behind; frames sit on the page with the upright ring arcs behind them. |
| Work: SocialSync | Eyebrow, h2, two short paragraphs; then the phone frame centred with the demo; step chips and Pause tour under the frame (wrap to two rows). | Text in 4 columns left (sticky while the demo is in view), demo right in a laptop frame (8 columns); chips and Pause above the frame. |
| How we work | Vertical rail: a 1px blue-tinted line at the left, five steps hanging off it (number, verb as h3, one sentence). No panel. | Horizontal rail: one hairline across, five equal columns hanging under it, each with number, verb, sentence. No cards. |
| FAQ | h2, then the accordion full width inside one glass panel (lite). | Two columns: h2 sticky left (4 cols), accordion right (8 cols) inside one panel. |
| Contact | Logo mark (168px square), tagline and h2, all centred (the only centred heading on the page), then the contact block, then the form in a `primary` glass panel. Submit buttons full width. | Left 5 columns: logo mark (220px square), tagline, h2, lead and contact block. Right 7 columns: the form in the `primary` glass panel. |
| Footer | Stacked lockup, links, contact, bottom row, single column. | Lockup left, two link columns right, bottom row. |

Privacy and 404: single column, max `44rem`, static CSS glow top-right, no sculpture, same nav and footer.

## 9. Motion
- `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`; `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)`.
- `--dur-1: 160ms` (hover, press), `--dur-2: 320ms` (disclosure, tabs, state changes), `--dur-3: 720ms` (reveal).
- Reveal: opacity 0 to 1 and `translateY(16px)` to 0, once, `--dur-3`, `--ease-out`, 60ms stagger, at most two reveal groups per viewport. Content is visible without JavaScript; the reveal is an enhancement. Never reveal the hero h1 (it is the largest paint).
- Only `transform` and `opacity` animate. No parallax on text, no scroll hijacking, no custom cursor, no marquee.
- `html[data-motion="still"]` or `prefers-reduced-motion: reduce`: reveals are instant, the demo does not autoplay, the sculpture shows one still poster, hover transitions stay (they are under 200ms).

**Sculpture** (`src/components/sculpture/`, media in `public/sculpture/`, built by `scripts/build-sculpture.py`)
- One fixed layer behind the page (`--z-sculpture`), `aria-hidden`, `pointer-events: none`. A poster image is in the HTML, so text and layout never wait for media.
- **Desktop (`min-width: 64rem`): scroll turns it.** 190 WebP frames (1440x810) drawn on one canvas. Page scroll picks the frame (down turns the rings forward, up turns them back), eased so it never jumps; a slow drift keeps it alive when the page is still. Neighbouring frames are cross-faded for in-between positions.
- **Phone and tablet: it plays.** A muted, inline, looping H.264 clip (the calm first part, forward then reversed, so the loop has no seam). Scroll never scrubs it; scroll only moves, scales and fades the layer.
- **Poses.** Each section has a pose (`x`, `y`, `scale`, `opacity`); the layer eases between neighbours by `transform` and `opacity` only. Hero is full strength; every other section is at or under the opacity limits in section 2.
- **Still mode** (`data-motion="still"`, reduced motion, Save-Data, or autoplay refused): the poster only, placed for the hero and scrolling away with it. The page looks finished.
- Edges of the frame are masked to transparent so the frame never shows as a rectangle.

**Intro** (`.intro`, once per browser session)
- "ELITE DIGITAL DYNAMICS" resolves letter by letter on the navy background, a thin pink line sweeps under it, then the wordmark shrinks toward the nav logo while the cover fades and the page appears. 1.5 s in total.
- CSS-only animation started by the inline head script, so it never waits for JavaScript and never blocks the page loading underneath. `pointer-events: none`: the first tap, scroll or key ends it at once and goes through to the page.
- Not shown under reduced motion or in still mode, and not shown again in the same session.

## 10. Accessibility
- WCAG 2.1 AA. Visible focus on everything. Skip link first, then "Pause background motion".
- Landmarks: `header`, `nav`, `main`, `footer`; one h1; headings in order.
- The sculpture layer and the intro are `aria-hidden`; the page works fully without them.
- Moving content (sculpture, demo tour) can be paused (visible controls) and respects reduced motion.
- Form: labels, `autocomplete`, inline errors linked with `aria-describedby`, error summary, focus management.
- Language `en-IN`. Phone numbers as `tel:+91…` links.

## 11. Conflict log
1. design-taste "no neon or outer glows" and its "no AI blue glow" rule **lost** to the owner's brief: the sculpture's blue core and one blue nebula glow are the chosen look. It stays one glow, not many, and nothing in the UI glows.
2. design-taste "no section-number eyebrows, at most one eyebrow per three sections" **partly won**: numbers 01 to 05 label real list items (services, steps) as in the reference, but section headers carry no numbered eyebrow. The brief's "small numbered labels" is still met.
3. ui-ux-pro-max dataset proposed a light palette (`#F8FAFC`), Calistoga + Inter and animated "liquid glass" **lost** to the reference and the logo (dark, Manrope). Kept from the dataset: expo-out easing, rgba hairlines, 44px targets with 8px gaps, at most three required form fields (we require two), no pure black, and its warning that blur is costly (lite glass default).
4. build-premium-website default stack (Vite, GSAP, Google Fonts links) **lost** to the brief (Next.js, self-hosted fonts, no CDN).
5. design-taste "hero has at most four text elements, no tagline under the buttons" **won** over the first draft: the tagline moved to the contact logo moment and the footer lockup.
6. design-taste "one label per intent" **won**: per-service "Ask about this" links were dropped; "Start a project" is the only contact label.
7. design-taste "no div-built fake product UI" **lost** to the brief for the SocialSync demo: the owner asked for it; it is a labelled, working demo and it is not in the hero.
8. design-taste "ship light and dark themes" **lost** to the reference: one dark theme, `color-scheme: dark`.
9. design-taste "no hand-rolled icons" **won**: Phosphor icons. Brand and SocialSync logos are supplied artwork, not icons.
10. Reference shows blur on every panel; architecture **limits** real blur to the nav and one primary panel, lite glass on phones by default, because smooth phones beat blur (owner approved).
11. design-taste "max one accent colour" **lost** to the owner's palette (blue and pink), but the split is strict: blue is atmosphere and structure, pink is only tap targets (section 2, Pink discipline).
12. The original brief said "real-time 3D, not a video". The owner **reversed** it in November 2026: the WebGL rings looked thin and broke phone layouts, so pre-rendered video replaced them. No three.js ships.
13. Owner preferred frame scrubbing on desktop only; on phones scroll moves the layer and the clip plays on its own, because scrubbing video stutters on many phones.

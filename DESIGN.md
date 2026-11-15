# DESIGN: Elite Digital Dynamics

The single file every build agent takes values from. Words and structure are in `SPEC.md`; contracts in `docs/ARCHITECTURE.md`. Written in order with build-premium-website, ui-ux-pro-max and design-taste-frontend.

## 1. Intent
- **Design read:** local business owners on phones; dark, calm, premium; low density; slow damped motion; one visual device (the live ring object, which is our logo in 3D).
- Near-black page, one red glow, glossy red rings, frosted dark glass, light-weight white type. One accent family (ember red to salmon). Nothing else is coloured.
- Ours, not DEVHAUS: the rings are our logo's two open rings, the layouts differ section by section, the page ends on the logo.
- Restraint over decoration: the rings are the only spectacle. Sections get a quiet reveal and nothing more.

## 2. Colour tokens

Anchored on the owner's logo files (`#FF8A6B`, `#C42415`, `#7A140D`, `#FF3B1F`, `#FFD9CC`, `#0A0606`) and pixels sampled from the reference (button `#A02211`, glow `#1E0103` to `#260403`).

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#080505` | page background (off-black, never `#000`) |
| `--color-ember-950` | `#140606` | deepest tinted surface, device bezels |
| `--color-ember-900` | `#2A0A07` | glow outer, pressed surfaces |
| `--color-ember-800` | `#4A0F0A` | glow mid, ring shadow side |
| `--color-ember-700` | `#7A140D` | ring body, deep accents |
| `--color-ember-600` | `#A32012` | **primary button fill** |
| `--color-ember-500` | `#C42415` | button hover, logo red |
| `--color-ember-400` | `#FF3B1F` | glowing core, live indicators |
| `--color-ember-300` | `#FF6A4D` | error border, bright accents |
| `--color-salmon` | `#FF8A6B` | number labels, eyebrows, ring edge highlight, links |
| `--color-hot` | `#FFD9CC` | core hot spot, focus ring |
| `--color-text` | `#F6F1EF` | headings and body |
| `--color-text-muted` | `#C4B9B6` | secondary text |
| `--color-hairline` | `rgb(255 255 255 / 0.10)` | panel and row borders |
| `--color-hairline-strong` | `rgb(255 138 107 / 0.32)` | nav pill, ghost button, active borders |
| `--color-focus` | `#FFD9CC` | focus ring |
| `--color-error` | `#FFA391` | error text (always with an icon and words) |
| `--color-success` | `#86D6A8` | success text and icon only |
| `--glass-fill` | `rgb(18 8 7 / 0.64)` | real glass (with blur) |
| `--glass-fill-lite` | `rgb(16 7 6 / 0.86)` | lite glass (no blur) |
| `--glass-blur` | `22px` | real glass only |
| `--field-fill` | `rgb(255 255 255 / 0.045)` | form fields |
| `--field-border` | `rgb(255 255 255 / 0.16)` | form fields |

Contrast (WCAG, computed):

| Pair | Ratio | Needs |
|---|---|---|
| `--color-text` on `--color-bg` | 18.1 | 4.5 |
| `--color-text-muted` on `--color-bg` | 10.6 | 4.5 |
| `--color-salmon` on `--color-bg` | 8.8 | 4.5 |
| white on `--color-ember-600` (button) | 7.6 | 4.5 |
| white on `--color-ember-500` (button hover) | 5.8 | 4.5 |
| `--color-text-muted` on lite glass over the brightest salmon | 8.6 | 4.5 |
| `--color-text` on real glass over the brightest salmon | 8.7 | 4.5 |
| `--color-focus` against bg / against button | 15.5 / 5.8 | 3 |
| `--color-text-muted` on real glass over the brightest salmon (worst case) | 5.1 | 4.5 (see rule below) |
| `--color-text-muted` on real glass over the ring body | 9.0 | 4.5 |
| `--color-error` / `--color-success` on bg | 10.5 / 11.8 | 4.5 |

Muted text on **real** glass directly over a bright highlight can dip under 4.5. Rule: the scene dims under panels (pose `dim`) and the contrast-sampler test is the judge. If it fails, raise `--glass-fill` alpha before touching text colour. Never put `ember-500` or darker as text on the dark background. Error state never relies on colour alone.

## 3. Glow and scrim (CSS layers behind content)
Stack, back to front: `--z-glow` 0, `--z-scene` 1, `--z-scrim` 2, `--z-content` 10, `--z-nav` 50, skip links 100.

- **Glow** (`.page-glow`): one fixed element, `140vmax` square, centred on the 3D object, moved only by `transform` (the scene writes it; compositor only, no repaint).
  `background: radial-gradient(closest-side, rgb(196 36 21 / 0.42) 0%, rgb(122 20 13 / 0.26) 30%, rgb(58 10 6 / 0.12) 58%, transparent 78%)`.
  Default position when no scene: phone centre `62% 58%`, desktop `70% 46%`. Opacity follows the pose dim (`1 - 0.6 * dim`).
- **Scrim** (`.page-scrim`): fixed, `pointer-events: none`:
  `linear-gradient(180deg, rgb(8 5 5 / 0.62) 0, transparent 16%, transparent 82%, rgb(8 5 5 / 0.55) 100%)`.
- **Text scrim** (`.text-scrim`, on any text block that sits over the object without a panel): a soft dark halo behind the block: `radial-gradient(closest-side, rgb(8 5 5 / 0.66), transparent)` on a pseudo-element extending `-12%` beyond the block.

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
- Number labels (01 to 05): `--text-eyebrow` size, weight 500, `font-variant-numeric: tabular-nums`, colour `--color-salmon`.
- Eyebrows: sentence case, not uppercase, colour `--color-salmon`. Only two on the home page (hero, SocialSync).
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
| Blur | `backdrop-filter: blur(22px) saturate(1.25)` | none |
| Border | `1px solid var(--color-hairline)` | same |
| Inner highlight | `inset 0 1px 0 rgb(255 255 255 / 0.07)` | same |
| Top sheen | `linear-gradient(180deg, rgb(255 255 255 / 0.045), transparent 38%)` overlay | same |
| Shadow | `0 24px 60px -24px rgb(0 0 0 / 0.7)` | same |

Blur budget: at most the nav pill and **one** `primary` panel blur in any viewport. Never nest glass in glass. Never animate transform or opacity of a blurred element. Cards inside a panel are flat (`rgb(255 255 255 / 0.03)` fill, hairline), not glass. Fallback where `backdrop-filter` is unsupported: lite.

## 7. Components

**Button** (pill, weight 500, `1rem`, one line always)
- Sizes: `md` 44px high, padding-inline 20px; `lg` 52px high, padding-inline 26px.
- Primary: fill `ember-600`, text white, `inset 0 1px 0 rgb(255 255 255 / 0.18)`. Hover: `ember-500`. Active: `scale(0.98)`. A trailing arrow icon moves 2px on hover.
- Ghost: transparent, border `--color-hairline-strong`, text `--color-text`. Hover: fill `rgb(255 255 255 / 0.06)`.
- Focus (all interactive elements): `outline: 2px solid var(--color-focus); outline-offset: 3px`.
- Disabled or pending: opacity 0.55, `aria-disabled`, no hover.

**Nav**
- Sticky, transparent at the top of the page. After 24px of scroll the links and button sit in one glass pill (the nav's blur).
- Desktop: lockup left (height 32px), four links centre-right (pill hit areas, 44px high, muted text, white on hover or current section with a salmon hairline border), primary button `md` right. One line at 1024.
- Phone: mark only (36px), primary button `md`, menu button (44px, icon). Menu is a full-width glass sheet under the nav with the four links (56px rows), then Call and WhatsApp. Closes on link tap, Escape and outside tap. Use native `popover` or `<dialog>` semantics.

**Section header**: h2, then lead under it (stacked, left aligned, never headline-left / paragraph-right). Space below: 48px phone, 64px desktop.

**Number label + item** (services, steps): label `01` in salmon above or left of the item title (h3). Rows separated by one hairline (bottom border only, none on the last).

**Device frames** (`DeviceFrame`)
- Phone: width `min(100%, 20.5rem)`, outer radius 36px, bezel `ember-950` with hairline, 8px bezel padding, screen radius 28px. Top bar 36px: lock icon + business name in `--text-small`, centred, muted. Screen scroller height `min(70svh, 560px)`.
- Laptop: screen frame radius 16px, top bar 40px with the business name in a centred pill (`rgb(255 255 255 / 0.06)`), then the screen (aspect 16:10, scroller inside), then a 10px base lip wider than the screen by 6% with rounded bottom corners.
- No fake traffic-light dots. The address shows the business name, never a URL.
- Under each frame: site name (h3), caption (muted), ghost button "Open live site" with arrow-up-right icon.

**FAQ**: native `<details name="faq">` (one open at a time), summary row 64px min height with the question in h3 size and a plus icon that rotates 45deg when open; answer in muted body text, max `58ch`. One hairline between items.

**Form fields**: label above (`--text-small`, weight 500, `--color-text`), field 52px high (textarea min 128px), fill `--field-fill`, border `--field-border`, radius `--radius-card`, padding-inline 16px, text `--color-text`, 16px font (prevents iOS zoom). Hover border `rgb(255 255 255 / 0.28)`. Focus: border `--color-salmon` plus the focus outline. Error: border `ember-300`, message below in `--color-error` with a warning icon. Helper text muted, `--text-small`. Native `<select>` with `color-scheme: dark` and a caret icon. No placeholder used as a label.

**Contact block**: a flat list (not cards): icon, label, value. Phone numbers and email are large tap targets (56px rows). WhatsApp is a ghost button with the WhatsApp icon.

**Footer**: stacked lockup (height 120px phone, 150px desktop) left; links and contact in two columns right; bottom row with the copyright line, Privacy link and the Pause motion control. Hairline on top. No glass.

**Icons**: `@phosphor-icons/react` (regular weight, 20px; 24px in the contact block). No hand-drawn icons, no emoji. Brand SVGs come from `public/brand/`. The SocialSync logo is drawn from the paths in the brief.

**Logo use**
- Nav desktop: `edd-lockup-horizontal.svg`; nav phone: `edd-mark.svg`; footer: `edd-lockup-stacked.svg`; favicon: `edd-favicon.svg`; apple icon, manifest icons and share image: built from `edd-app-icon.svg` and `edd-mark.svg`; one-colour needs: `edd-mark-mono.svg` (`currentColor`).
- Always render with visible or visually-hidden text "Elite Digital Dynamics" next to it; the image itself gets empty alt when the text is adjacent.

## 8. Layout per section (seven different families, none repeated)

| Section | Phone (360 to 430) | Desktop (1440) |
|---|---|---|
| Hero | Text block at top, left aligned, over a text scrim; object fills the lower half, bleeding off the right edge; primary button full width, ghost button full width under it. Hero fits one screen (`min-height: 100svh`). | Text left, 7 of 12 columns, vertically centred slightly high; object right, large, partly behind the text column's edge. Buttons in one row. |
| Services | One `primary` glass panel holding a numbered index: each service is a row (number, name, promise, three deliverables as a plain list). All rows open; no accordion. | Same single panel, 12 columns: number (1 col), name + promise (5 cols), deliverables (6 cols, in one row of three short lines). Not cards, not three equal columns. |
| Work: client sites | Segmented control with the three business names (pill tabs, horizontally scrollable if needed); **one** phone frame shown for the selected site; name, caption and "Open live site" under it. Only the selected iframe is mounted. | Asymmetric trio in one row: laptop frame (about 58% width) for the first site and two phone frames for the others, bottoms aligned. No glass panel behind; frames sit on the page with the upright ring arcs behind them. |
| Work: SocialSync | Eyebrow, h2, two short paragraphs; then the phone frame centred with the demo; step chips and Pause tour under the frame (wrap to two rows). | Text in 4 columns left (sticky while the demo is in view), demo right in a laptop frame (8 columns) with the Phone / Laptop toggle; chips and Pause above the frame. |
| How we work | Vertical rail: a 1px salmon-tinted line at the left, five steps hanging off it (number, verb as h3, one sentence). No panel. | Horizontal rail: one hairline across, five equal columns hanging under it, each with number, verb, sentence. No cards. |
| FAQ | h2, then the accordion full width inside one glass panel (lite). | Two columns: h2 sticky left (4 cols), accordion right (8 cols) inside one panel. |
| Contact | Tagline and h2 centred under the 3D logo (the only centred heading on the page), then the contact block, then the form in a `primary` glass panel. Submit buttons full width. | Left 5 columns: the 3D logo settles above the tagline, h2, lead and contact block. Right 7 columns: the form in the `primary` glass panel. |
| Footer | Stacked lockup, links, contact, bottom row, single column. | Lockup left, two link columns right, bottom row. |

Privacy and 404: single column, max `44rem`, static CSS glow top-right, no 3D, same nav and footer.

## 9. Motion
- `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`; `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)`.
- `--dur-1: 160ms` (hover, press), `--dur-2: 320ms` (disclosure, tabs, state changes), `--dur-3: 720ms` (reveal).
- Reveal: opacity 0 to 1 and `translateY(16px)` to 0, once, `--dur-3`, `--ease-out`, 60ms stagger, at most two reveal groups per viewport. Content is visible without JavaScript; the reveal is an enhancement. Never reveal the hero h1 (it is the largest paint).
- Only `transform` and `opacity` animate. No parallax on text, no scroll hijacking, no custom cursor, no marquee.
- `html[data-motion="still"]` or `prefers-reduced-motion: reduce`: reveals are instant, the demo does not autoplay, the scene shows one still frame, hover transitions stay (they are under 200ms).

**Scene values (so 3D matches CSS)**
- Ring body `#6A0F0C` (between `ember-700` and the reference ring), metalness 1, roughness 0.2, clearcoat on the top tier.
- Edge highlights: environment strip lights `#FF8A6B` and `#FFD9CC`; large soft key `#C42415`; dim fill `#2A0A07`.
- Core: unlit `#FF3B1F` with a hot centre `#FFD9CC` offset up-left (as in the logo); halo sprites `#FF3B1F` at 0.55 and `#C42415` at 0.25; point light `#FF4A2A`.
- **Logo geometry** (from `edd-mark.svg`, 64-unit box, y down; normalised to outer radius 1): outer ring A radius 22 (1.00), band 6.4 (0.291), gap 64deg centred at top-right (45deg above the +x axis); inner ring B radius 12.5 (0.568), band 3.6 (0.164), gap 70deg centred at bottom-left (225deg); core radius 6 (0.273); glow radius 16 (0.727). Round ends on both rings. A is lit salmon at top-left and darkest at bottom-right (gradient direction of the logo).
- Idle: A and B turn in opposite directions (the gaps make the turn visible). Two thin closed orbit rings C and D add depth and fold into the core in the contact pose.
- Contact pose = the logo exactly, facing the viewer, turning stopped (spin eases to the nearest full turn so there is no snap).
- Bloom: none. Only if the side-by-side with the reference shows the glow clearly weaker: one half-resolution bloom pass at tier 3 on desktop, with its measured frame cost reported.

## 10. Accessibility
- WCAG 2.1 AA. Visible focus on everything. Skip link first, then "Pause background motion".
- Landmarks: `header`, `nav`, `main`, `footer`; one h1; headings in order.
- The canvas is `aria-hidden`; the page works fully without it.
- Moving content (scene, demo tour) can be paused (visible controls) and respects reduced motion.
- Form: labels, `autocomplete`, inline errors linked with `aria-describedby`, error summary, focus management.
- Language `en-IN`. Phone numbers as `tel:+91…` links.

## 11. Conflict log
1. design-taste "no neon or outer glows" **lost** to the reference: the red glow is the owner's chosen look. It stays one glow, not many.
2. design-taste "no section-number eyebrows, at most one eyebrow per three sections" **partly won**: numbers 01 to 05 label real list items (services, steps) as in the reference, but section headers carry no numbered eyebrow. The brief's "small numbered labels" is still met.
3. ui-ux-pro-max dataset proposed a light palette (`#F8FAFC`), Calistoga + Inter and animated "liquid glass" **lost** to the reference and the logo (dark, Manrope). Kept from the dataset: expo-out easing, rgba hairlines, 44px targets with 8px gaps, at most three required form fields (we require two), no pure black, and its warning that blur is costly (lite glass default).
4. build-premium-website default stack (Vite, GSAP, Google Fonts links) **lost** to the brief (Next.js, React Three Fiber, self-hosted fonts, no CDN).
5. design-taste "hero has at most four text elements, no tagline under the buttons" **won** over the first draft: the tagline moved to the contact logo moment and the footer lockup.
6. design-taste "one label per intent" **won**: per-service "Ask about this" links were dropped; "Start a project" is the only contact label.
7. design-taste "no div-built fake product UI" **lost** to the brief for the SocialSync demo: the owner asked for it; it is a labelled, working demo and it is not in the hero.
8. design-taste "ship light and dark themes" **lost** to the reference: one dark theme, `color-scheme: dark`.
9. design-taste "no hand-rolled icons" **won**: Phosphor icons. Brand and SocialSync logos are supplied artwork, not icons.
10. Reference shows blur on every panel; architecture **limits** real blur to the nav and one primary panel, lite glass on phones by default, because smooth phones beat blur (owner approved).

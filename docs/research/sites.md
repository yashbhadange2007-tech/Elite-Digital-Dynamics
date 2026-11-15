# Client sites: scouting facts for the portfolio frames

Probed on 2026-11-15 with Playwright 1.63 (headless Chromium only) from the build container. Read with `docs/BRIEF.md` ("Our work: live client sites") and `docs/ARCHITECTURE.md` section 4. Same facts, machine-readable: `docs/research/sites.json`.

## Headline

- All three sites load (HTTP 200), send no `X-Frame-Options` and no `Content-Security-Policy`, and render inside a sandboxed iframe. **All three are frameable.**
- **`tall` mode fails on all three sites, at both 390 and 1280.** Each hero is `min-height: 100vh`, so in a tall iframe the hero grows to the full iframe height and everything below it is pushed out and cut off. The measured height never converges (it grows by one page length on every resize).
- Goodlife Fitness and Goodlife Fitness Club work as `interactive` iframes (correct render, scroll passes back to our page at both ends, wheel and touch).
- Hotel Orient Elite renders correctly as `interactive`, but it runs a smooth-scroll library that **never releases the mouse wheel to our page**, and it downloads **41.3 MB on every mount**. Recommended mode: `screenshot`.
- The two Goodlife sites are clearly different: different address, phone, hours and offer. Details below.

## Summary table

| | Hotel Orient Elite | Goodlife Fitness | Goodlife Fitness Club |
|---|---|---|---|
| slug | `hotel-orient-elite` | `goodlife-fitness` | `goodlife-fitness-club` |
| Caption (max 12 words) | Central Solapur hotel: rooms, vegetarian restaurant, rooftop cafe and event hall. | Premium gym in Murarji Peth, Solapur, with boxing, yoga, steam and spa. | 24-hour weights-and-cardio gym at Sai Trade Center, Solapur. |
| Final URL | `https://hotelorientelite.co.in/` | `https://goodlife-fitness-website.vercel.app/` | `https://goodlife-fitness-club.vercel.app/` |
| Redirects | none | none | none |
| Frameable | yes | yes | yes |
| Mode, phone frame (390) | **screenshot** | **interactive** | **interactive** |
| Mode, laptop frame (1280) | **screenshot** | **interactive** | **interactive** |
| Document height at 390 | 19,850 px (varies about ±50) | 26,296 px | 10,169 px (9,368 before lazy images) |
| Document height at 1280 | 15,068 px | 22,997 px | 7,500 px (7,233 before lazy images) |
| Footer colour | `#050403` | `#090706` | `#070707` |
| Page weight, full page | 41.3 MB, 26 requests | 5.0 MB, 34 requests | 20.2 MB, 25 requests |
| Weight on iframe mount (before any scroll) | 36.8 to 41.3 MB | 1.75 MB, 11 requests | 0.97 MB, 10 requests |
| External hosts requested | `fonts.googleapis.com`, `fonts.gstatic.com`, `www.google.com` (map) | `fonts.googleapis.com`, `fonts.gstatic.com`, `maps.google.com` (map) | `fonts.googleapis.com`, `fonts.gstatic.com`, `www.google.com` (map) |
| Failed here | `www.google.com` | `maps.google.com` | `www.google.com` |
| Main problems | hero stretches in tall iframe; wheel trapped in interactive iframe; 41.3 MB eager load | hero stretches in tall iframe; very long page (26,296 px at 390) | hero stretches in tall iframe; 2 MB PNGs load on first scroll |

Heights are from a normal top-level load (390x844 mobile user agent with touch, and 1280x800), measured after scrolling the whole page once so lazy content had loaded.

## How it was measured

Scripts and all screenshots are in the session scratchpad (not in the repo):
`/tmp/claude-0/-home-user-Elite-Digital-Dynamics/ff53f3cc-0df7-51ca-8cac-2cf57e944bce/scratchpad/sites/`

| Script | What it does |
|---|---|
| `probe.js <slug> <url>` | Normal load at 390x844 (mobile UA, touch) and 1280x800. Text, headings, links, media, overflow, network, first-viewport and full-page screenshots. |
| `server.js` + `framed.js <slug> <url>` | Local host page on port 4391 with the site in an iframe. Height sequence (800, then the measured `scrollHeight`, four times), which elements grew, then a fresh sandboxed load at full height with stitched screenshots. |
| `interactive.js <slug> <url>` | Sandboxed normal-height iframe (1280x800, 390x760, 390x640 touch). Render, wheel scrolling, link clicks under the sandbox. |
| `touch.js <slug> <url>` | Scroll only: touch swipes and wheel at the top and bottom edge of the framed page. |
| `loadevt.js`, `footer.js`, `fp.js` | iframe `load` timing, footer colours as hex, full-page screenshot wrap test. |

Screenshots: `out/<slug>/mobile-first.png`, `mobile-full.png`, `desktop-first.png`, `desktop-full.png` (normal load), `d390-B-scrolled.png`, `d1280-B-scrolled.png` (tall iframe), `d390-I-first.png`, `d1280-I-first.png`, `m390-I-first.png` (interactive iframe). Contact sheets in `sheets/`. All were opened and inspected.

Environment limits that affect the results:
- Only the three site hosts were reachable, plus Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com` loaded normally). `www.google.com` and `maps.google.com` were refused (`net::ERR_TUNNEL_CONNECTION_FAILED`), so **the Google Maps panel on each site is an empty dark box in every screenshot taken here**. Nothing else was visually missing.
- Plain `http://` cannot be routed here, so only `https://` was tested.
- Form submits were deliberately not exercised on the client sites.

## Findings that apply to all three

**Framing headers.** One hop each, status 200, `server: Vercel`. No `X-Frame-Options`, no `Content-Security-Policy`, no `Content-Security-Policy-Report-Only`, no `<meta http-equiv>` CSP in the HTML. Confirmed twice: with `curl -L -D -` and from the navigation response when loaded inside the iframe.

**Tall iframe.** Sequence = iframe height, then the framed document's `scrollHeight`.

| Site | Width | 800 | resize 1 | resize 2 | resize 3 | resize 4 | Growth per step |
|---|---|---|---|---|---|---|---|
| Hotel Orient Elite | 390 | 19,892 | 38,504 | 57,116 | 75,728 | 94,308 | 93.6%, 48.3%, 32.6%, 24.5% |
| Hotel Orient Elite | 1280 | 15,068 | 29,256 | 43,444 | 57,632 | 71,820 | 94.2%, 48.5%, 32.7%, 24.6% |
| Goodlife Fitness | 390 | 26,296 | 51,328 | 76,360 | 101,392 | 126,424 | 95.2%, 48.8%, 32.8%, 24.7% |
| Goodlife Fitness | 1280 | 22,997 | 44,783 | 66,569 | 88,355 | 110,141 | 94.7%, 48.7%, 32.7%, 24.7% |
| Goodlife Fitness Club | 390 | 9,324 | 17,848 | 26,372 | 34,896 | 43,420 | 91.4%, 47.8%, 32.3%, 24.4% |
| Goodlife Fitness Club | 1280 | 7,233 | 13,666 | 20,099 | 26,532 | 32,965 | 88.9%, 47.1%, 32.0%, 24.3% |

The limit in the architecture is 3%. Results were the same with a mobile touch host context at 390.

**Sandbox `allow-scripts allow-same-origin`.** All three run normally. No attempt to navigate the top window (also checked without a sandbox), no popups on load, no dialogs, no console errors, no page errors. The bundles contain no `top.location`, `window.top` or `parent.location`.
- Every external link on all three sites has `target="_blank"`. Under the sandbox a click does nothing (console: "Blocked opening ... in a sandboxed frame whose 'allow-popups' permission is not set"). So a click inside the frame cannot replace the framed page with a third-party page.
- `tel:` links: a click leaves the frame URL unchanged.
- In-page `#` navigation works.
- The framed sites' own Call, WhatsApp, Instagram and map buttons are therefore dead inside an interactive frame. The "Open live site" button is the only way out, which is what the brief wants.

**iframe `load` event.** Fires 0.6 to 1.9 s after navigation here for all three, inside the 8 s rule. On the hotel it fires at about 1 s while 17 image requests are still in flight, so `load` does not mean "finished" for that site.

**Lazy images inside an iframe.** Both Goodlife sites mark their images `loading="lazy"` (24 of 28 and 15 of 16). In a top-level tab Chromium fetched those well before they scrolled into view; inside the cross-origin iframe they were fetched only once visible. That is why Goodlife Fitness Club transferred 18.9 MB at load in a tab but 0.97 MB on iframe mount. The hotel preloads its photos from JavaScript (`new Image()` and `rel=preload`), so nothing there is lazy.

**No horizontal overflow at 390** on any site (`scrollWidth` 390 = viewport 390, normal load and framed).

**No cookie banners, no popups, no autoplay with sound.**

**Screenshot capture warning.** With the WebGL flags from the architecture (`--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`), `page.screenshot({ fullPage: true })` wraps after about 8,192 px: the top of the page repeats. Reproduced on a 24,000 px test page (bands 8 to 23 wrong). Without those flags a 24,000 px full-page capture was correct. Capture with `clip` tiles (4,096 px or less) and launch the screenshot browser without the GPU flags. Those flags also made screenshots of Goodlife Fitness take 11 to 18 s each at 1280 and time out once.

---

## 1. Hotel Orient Elite

- **URL:** `https://hotelorientelite.co.in` → final `https://hotelorientelite.co.in/`, 200, no redirect.
- **Hosts:** apex only in the chain. `https://www.hotelorientelite.co.in/` also answers 200 with the same ETag and does **not** redirect to the apex. `frame-src` needs `https://hotelorientelite.co.in`.
- **Name as shown:** "Hotel Orient Elite" (header wordmark, `h1`, footer). The building sign in the hero photo reads "HOTEL ORIENT ELITE / LODGING & VEG RESTAURANT".
- **Title:** `Hotel Orient Elite | Cinematic Hospitality in Solapur`
- **Meta description:** `Hotel Orient Elite, Solapur - a cinematic luxury hospitality experience.`
- **Main headings:** Hotel Orient Elite / Spaces designed for calm living. / Curated comfort stays. / Vegetarian dining with warm hospitality. / Rooftop evenings with a quieter glow. / Gatherings framed with elegance. / Guest trust, quietly earned. / A central address, easy to reach. / Reserve your stay with quiet ease.
- **Address:** Balives Rd, South Kasba, Budhavar Peth, Solapur, Maharashtra 413002.
- **Phones:** hotel 070587 57171 (also the WhatsApp number); Ojas Veg Restaurant +91 70586 48181; Catena Cafe +91 88570 37171; Riddhi Siddhi Hall +91 70586 48181.
- **Also on the page:** "A refined stay in the heart of Solapur", "Rated 4.6 by 1,211+ guests", "Check-in from 2:00 PM", five room types (Executive Deluxe Twin Bed AC, Executive Suite AC, Deluxe Queen Bed AC, Single Non AC, Dormitory Stay), Ojas Veg Restaurant, Catena Cafe (rooftop), Riddhi Siddhi Hall (engagements, birthdays, family occasions), Google reviews carousel, map, WhatsApp booking form.
- **What it is for:** a single-page hotel site that sends room enquiries to WhatsApp and phone.
- **Caption:** "Central Solapur hotel: rooms, vegetarian restaurant, rooftop cafe and event hall." (11 words)

**Normal load.** 19,850 px at 390 (observed 19,748 to 19,892 across loads: the rotating review card changes height, and iframe height matters slightly); 15,068 px at 1280. Footer and page background `#050403` (also its `theme-color`). 26 requests, 41,316,246 bytes: 17 PNG photos = 36.6 MB (about 1.8 to 2.8 MB each, for example 938x1537), one MP4 = 4.5 MB, JS 181 KB. Images are not lazy: 36.8 to 41.3 MB had transferred by the time the page settled, without scrolling.

**Preloader.** A "Welcome to Hotel Orient Elite" screen shows from about 1.2 s and is gone by about 3 s (framed and unframed). It finished on every load.

**Media.** One `<video>`: autoplay, muted, loop. No audio. The "Watch craft film" control was not clicked.

**External hosts.** `fonts.googleapis.com` and `fonts.gstatic.com` (loaded). `www.google.com` (Maps embed in the location section, failed here: the map box is empty in the screenshots, 322x320 at 390 and 587x724 at 1280). Links only: `www.instagram.com`, `wa.me`, `www.google.com/maps`.

**Tall iframe: fails.** Elements tied to viewport height:
- `section#hero.relative.min-h-screen.overflow-hidden` → `min-height: 100vh` (1,216 px at 390 normally, 19,892 px in the tall iframe).
- its child `.luxury-container ... min-h-[calc(100vh-var(--nav-height))]`.
- decorative `.h-[76vh]`, `.h-[68vh]`; hero image `max-h-[50vh]` / `lg:max-h-[calc(100vh-6.5rem)]`.
- `body` and `.page-shell` also have `min-height: 100vh` (harmless).
- two fixed full-viewport layers (`.fixed.inset-0.bg-luxury-radial`, `.grain-overlay`) become as tall as the iframe.

Loaded directly at 19,850 px (390) the document became 38,526 px; at 15,068 px (1280) it became 29,256 px. Screenshot: header at the very top only, the hero photo and text floating thousands of pixels down in a dark empty column, every other section cut off.

**Interactive iframe.** Renders correctly at 1280x800, 390x760 and 390x640 (touch host). Scroll-reveal content appears when scrolled (0 hidden text elements after a full scroll).
- **Wheel is trapped.** The site uses Lenis smooth scrolling (`smoothWheel: true`; `html` has class `lenis`). With the framed page at its end (`scrollY` 14,307 of 14,307), eight wheel events of 300 px over the frame moved our page 0 px. With the framed page at the top and our page at 250 px, six wheel-up events moved our page 0 px. With the pointer outside the frame the same wheel events scrolled our page. Repeated on three runs.
- **Touch is not trapped.** After the framed page reached its end, four swipes moved our page 2,047 to 2,523 px (three runs).
- **Weight.** 36.8 MB (1280x800) to 41.3 MB transferred on mount, every mount.
- Booking form: its handler calls `window.location.assign()` with a WhatsApp URL. Not submitted in testing. The sandbox has no `allow-forms`, which by the HTML spec stops submission before the handler runs.

**Recommendation: `screenshot` for both frames.**
- Phone frame (390): `screenshot`. Evidence: tall stretches; a live iframe pulls 41.3 MB onto a visitor's phone before they touch it.
- Laptop frame (1280): `screenshot`. Evidence: tall stretches; a live iframe holds the mouse wheel and never gives it back, plus the same 41.3 MB.
- By the brief's literal rule this site would be `interactive` (it frames, and it renders correctly at normal height). If the owner wants it live regardless, use `interactive` only with both of these: mount the iframe after the visitor clicks (screenshot until then), and keep `pointer-events: none` on the iframe until that click and again on `mouseleave`.
- Screenshot assets exist: `out/hotel-orient-elite/mobile-full.png` (390x19,850) and `desktop-full.png` (1280x15,068). Their map box is empty because Google was unreachable here.

---

## 2. Goodlife Fitness

- **URL:** `https://goodlife-fitness-website.vercel.app` → final `https://goodlife-fitness-website.vercel.app/`, 200, no redirect, one host.
- **Name as shown:** "GOODLIFE FITNESS" (header logo, two lines). Title, `og:site_name` ("Goodlife Fitness Solapur") and the address block say "Goodlife Fitness". **The footer says "GOODLIFE FITNESS CLUB · SOLAPUR / © 2026 Goodlife Fitness Club"**, body copy says "Goodlife Fitness Club" in two places, and its structured data has `alternateName: "Goodlife Fitness Club Solapur"`.
- **Title:** `Goodlife Fitness | Best Premium Gym in Solapur | CrossFit, Zumba, Boxing, Yoga`
- **Meta description:** `Solapur's #1 premium gym in Murarji Peth. CrossFit, Zumba, Boxing, Power Yoga, Steam Bath, Spa & Salon. Expert trainers. Open Mon–Sat 6AM–11PM, Sun 6AM–12PM. Join Goodlife Fitness today.`
- **Main headings:** Biggest fitness destination in Solapur / First impressions of excellence / Our facilities — premium gym in Solapur / Where champions are built / World-class training equipment / High-energy cardio experience / Boost endurance. Burn fat. / Unleash your fighter spirit / Strength of body. Peace of mind. / Secure storage. Effortless comfort. / Polished after every session / Recover deeper. Return stronger. / Luxury recovery in quiet focus / Clean finish. Premium comfort. / Every transformation starts with a plan / Real fitness transformations in Solapur / Expert personal trainers in Solapur / Goodlife Fitness family / Capture your fitness journey / What our Solapur members say / Send enquiry / Premium training. Real transformation. / Frequently asked questions / Visit Goodlife Fitness — best gym in Solapur.
- **Address:** Goodlife Fitness, Sai Icon, near Ambassador Hotel, Dharamsi Lane, Murarji Peth, Solapur, Maharashtra 413001, India.
- **Phones:** +91 94039 25958, +91 99752 12686 (WhatsApp goes to 94039 25958).
- **Hours:** Mon–Sat 6:00 AM – 11:00 PM, Sun 6:00 AM – 12:00 PM.
- **Also on the page:** "5000+ transformations", "100+ advanced machines", "5.0★ Google rating"; zones for strength, machines, spin studio, cardio, boxing, yoga, lockers, salon, steam, spa, showers; "Raghu Sir — Owner"; enquiry form that opens WhatsApp. Orange and black design.
- **What it is for:** a long single-page showcase of a premium gym and its facilities, pushing WhatsApp and call enquiries.
- **Caption:** "Premium gym in Murarji Peth, Solapur, with boxing, yoga, steam and spa." (12 words)

**Normal load.** 26,296 px at 390; 22,997 px at 1280 (same on every load). Page background and footer `#090706` (the section just above the footer bar is `#0f0d0b`). 34 requests, 4,991,071 bytes after a full scroll (26 images = 4.7 MB, mostly WebP; one 1.0 MB logo PNG). At load, before scrolling: 10 to 11 requests, 1.74 to 2.0 MB.

**Scroll reveals.** 97 text elements are at opacity 0 on load and all appear after scrolling (0 hidden after a full scroll in a tab and in the interactive iframe at 1280; 2 still at opacity 0 in the 390 iframe when checked right after a fast wheel scroll).

**Fixed elements.** Header (80 px). At 390 a fixed "CALL / WHATSAPP" bar sits 16 px above the bottom edge.

**Media.** None.

**External hosts.** `fonts.googleapis.com`, `fonts.gstatic.com` (loaded). `maps.google.com` (Maps embed in "Visit us", failed here: empty box, 340x400 at 390 and 718x573 at 1280). Links only: `wa.me`, `www.instagram.com`, `instagram.com`.

**Tall iframe: fails.** `section#top.relative.min-h-screen.overflow-hidden` and its inner `div.relative.mx-auto.flex.min-h-screen.max-w-7xl` are `min-height: 100vh` (1,266 px at 390 normally, 26,297 px in the tall iframe). The outer wrapper `div.dark.min-h-screen` is the third match. Loaded directly at 26,296 px the document became 51,328 px (22,997 → 44,783 at 1280). Screenshot: the hero photo blown up and blurred over the whole 26,296 px, headline pushed to the bottom, every other section cut off, and all 97 reveal elements still at opacity 0 because they sit below the cut. The mobile CALL/WHATSAPP bar ends up at y 26,238.

**Interactive iframe: works.** Correct at 1280x800, 390x760 and 390x640.
- Wheel: scrolls the framed page; at its end eight wheel events moved our page 2,400 px; at its top, wheel-up moved our page from 250 to 0.
- Touch: three swipes scrolled the frame 1,155 px; at the frame's end four swipes moved our page 2,796 px.
- Weight: 1.75 MB on mount, 5.0 MB if the visitor scrolls the whole page.
- The enquiry form calls `window.open("https://wa.me/...", "_blank")`, which the sandbox blocks. Not submitted in testing.

**Recommendation: `interactive` for both frames.**
- Phone frame (390): `interactive`. Evidence: tall stretches the hero to 26,296 px; at normal height it renders correctly, costs 1.75 MB on mount and passes scroll back at both ends.
- Laptop frame (1280): `interactive`. Same evidence (22,997 px, same scroll results).
- Note the length: a visitor who keeps the pointer or finger inside the frame scrolls through 23,000 to 26,000 px before the page takes over again.

---

## 3. Goodlife Fitness Club

- **URL:** `https://goodlife-fitness-club.vercel.app` → final `https://goodlife-fitness-club.vercel.app/`, 200, no redirect, one host.
- **Name as shown:** "GOODLIFE FITNESS CLUB" (header, footer, title, `h1` eyebrow "Goodlife Fitness Club — Solapur").
- **Title:** `Goodlife Fitness Club | 24 Hour Gym in Solapur`
- **Meta description:** `Goodlife Fitness Club — Solapur's 24-hour gym. Advanced equipment, cardio, free weights & expert trainers. 4.9★ from 274 reviews. Free parking.`
- **Main headings:** Solapur's 24-hour fitness destination / The Goodlife difference / Built for serious training / Meet our founder / Our expert trainers / Transformations by Arvind Sir / Why Goodlife / Members speak / Train in the heart of Solapur / Your transformation starts today.
- **Address:** Goodlife Fitness Club, Sai Trade Center, 4th Floor, near BSNL Office, Solapur, Maharashtra 413002. Plus Code MWJ4+FM Solapur.
- **Phone:** +91 93253 42686 (also WhatsApp).
- **Hours:** Open 24 hours.
- **Also on the page:** "274+ verified reviews", "4.9★ Google rating", "3 expert trainers" (Arvind Sir, Shera Sir, Nita Mam), "Raghu Sir — Founder", free parking (garage, lot and street), kid friendly, LGBTQ+ friendly, contactless payments, online classes, outdoor terrace training zone. Red and black design.
- **What it is for:** a compact single-page site for a 24-hour weights-and-cardio gym, pushing WhatsApp and call sign-ups.
- **Caption:** "24-hour weights-and-cardio gym at Sai Trade Center, Solapur." (8 words)

**Normal load.** At 390x844: 9,368 px at load, 10,169 px after scrolling the page once (lazy images had loaded). At 1280x800: 7,233 px, then 7,500 px. The hero is exactly one viewport tall, so the height also moves with the viewport height (9,324 px in a 390x800 iframe before lazy images). Page background and footer `#070707`. 25 requests, 20.2 MB after a full scroll: 16 images = 20.0 MB, of which eight facility photos are 2.0 to 2.7 MB PNGs each (for example 940x1672).

**Hero counters.** "274+", "4.9", "24 hours", "3" count up from 0 over the first 2 to 3 s. A screenshot taken too early shows wrong numbers (for example "150+ / 2.7"). Wait at least 4 s before capturing.

**Fixed elements.** Header (66 px). At 390 a fixed "CALL / WHATSAPP" bar (56 px) on the bottom edge.

**Media.** None.

**External hosts.** `fonts.googleapis.com`, `fonts.gstatic.com` (loaded). `www.google.com` (Maps embed in "Find us", failed here: empty box, 356x288 at 390 and 546x320 at 1280). Links only: `wa.me`, `www.google.com/maps`. The `og:image` points at an `r2.dev` host but the browser never requests it.

**Tall iframe: fails.** `section#top.relative.flex.min-h-[100vh].min-h-svh.items-end.overflow-hidden` → `min-height: 100svh`. Document height = iframe height + 8,524 px at 390 (+ 6,433 px at 1280), every time. Loaded directly at 10,169 px the document became 18,693 px (7,500 → 13,933 at 1280). Screenshot: the hero photo scaled to cover 390x10,169, hero text at the very bottom (the section is `items-end`) with the CALL/WHATSAPP bar on top of it at y 10,113, every other section cut off.

**Interactive iframe: works.** Correct at 1280x800, 390x760 and 390x640.
- Wheel: at the framed page's end eight wheel events moved our page 2,400 px; at its top, wheel-up moved our page from 250 to 0.
- Touch: three swipes scrolled the frame 1,950 px; at the frame's end four swipes moved our page 2,411 px.
- Weight: 0.97 MB on mount. The eight 2 MB facility photos sit right under the hero, so the first scroll inside the frame pulls roughly 17 MB; a full scroll totals 20.2 MB.

**Recommendation: `interactive` for both frames.**
- Phone frame (390): `interactive`. Evidence: tall stretches the hero and cuts the rest; at normal height it renders correctly, costs 0.97 MB on mount and passes scroll back at both ends. Caveat: about 17 MB on the visitor's first scroll inside the preview.
- Laptop frame (1280): `interactive`. Same evidence.

---

## The two Goodlife entries

They are different, not near-identical. Evidence quoted from the pages:

| | Goodlife Fitness | Goodlife Fitness Club |
|---|---|---|
| Address | "Sai Icon, near Ambassador Hotel, Dharamsi Lane, Murarji Peth, Solapur, Maharashtra 413001" | "Sai Trade Center, 4th Floor, near BSNL Office, Solapur, Maharashtra 413002" |
| Phone | "+91 94039 25958", "+91 99752 12686" | "+91 93253 42686" |
| Hours | "Mon–Sat: 6:00 AM – 11:00 PM / Sun: 6:00 AM – 12:00 PM" | "Open 24 hours", "open 24 hours, every single day" |
| Offer | "CrossFit, Zumba, Boxing, Power Yoga, Steam Bath, Spa & Salon"; spin studio, lockers | "a serious weights-and-cardio gym"; free weights, cardio, outdoor terrace zone, "Free parking" |
| Headline | "Biggest fitness destination in Solapur" | "Solapur's 24-hour fitness destination" |
| Rating shown | "5.0★ Google rating" | "4.9★ from 274 reviews" |
| Look | orange on black, 26,296 px long at 390 | red on black, 10,169 px long at 390 |

What they share: both name "Raghu Sir" (Owner on one, Founder on the other), and the first site also calls itself "Goodlife Fitness Club" in its footer and body copy. So the names alone will confuse a reader. Tell them apart by place and purpose, both of which are on the pages:
- Address-bar label / name: "Goodlife Fitness" and "Goodlife Fitness Club", as each header shows.
- Captions: "Premium gym in Murarji Peth, Solapur, with boxing, yoga, steam and spa." and "24-hour weights-and-cardio gym at Sai Trade Center, Solapur."
- If a short tag is wanted next to the name: "Murarji Peth" and "Sai Trade Center, open 24 hours".

Whether these are two physical branches of one business was not checked outside the two pages.

## Notes for whoever builds the frames

1. Do not ship `tall` for any of these. There is no height that works: document height = iframe height + a constant.
2. `interactive` iframe size: the sites were checked at 390x640, 390x760 and 1280x800. Viewport units resolve against the iframe height, so each hero is at least as tall as the visible frame.
3. Under the sandbox, clicks inside an interactive frame only follow in-page `#` links. If a second `load` event ever fires on the iframe, something navigated it: reset `src` or fall back to the screenshot.
4. Redirect entries for `next.config.ts`: `/visit/hotel-orient-elite` → `https://hotelorientelite.co.in/`, `/visit/goodlife-fitness` → `https://goodlife-fitness-website.vercel.app/`, `/visit/goodlife-fitness-club` → `https://goodlife-fitness-club.vercel.app/`.
5. `frame-src` hosts: `https://hotelorientelite.co.in`, `https://goodlife-fitness-website.vercel.app`, `https://goodlife-fitness-club.vercel.app`. No redirect hosts to add.
6. Screenshots for skeletons and for the hotel: capture after scrolling the page once (Goodlife Fitness has 97 elements at opacity 0 until scrolled), wait 4 s on Goodlife Fitness Club for the counters, wait 3 s on the hotel for the preloader, use `clip` tiles, no GPU flags. The fixed mobile CALL/WHATSAPP bars and the fixed headers appear once in a tiled capture, at their viewport position in the first tile.
7. Screenshots captured in this container have an empty map box on all three sites.

## Not verified

- `http://` to `https://` redirect hops for any host (plain HTTP is not routable from here).
- Anything served by Google Maps: the embeds did not load, so their look, their extra hosts, their weight and their behaviour inside a sandboxed nested frame are unknown. Page weights above exclude them.
- Real devices and other engines. Everything is headless Chromium with emulated mobile and synthetic touch events. iOS Safari (where `100vh`/`100svh` and Lenis behave differently) and Firefox were not tested.
- Form submits (hotel booking form, Goodlife Fitness enquiry form): not exercised. Their behaviour under the sandbox is from the HTML spec and from reading the bundles, not from a test.
- The hotel's "Watch craft film" button and the mobile menus were not opened.
- Load times and preloader duration on a slow connection. Timings here are from a data-centre link.
- Headers from other regions or for other user agents. One vantage point, one day.
- Whether the two Goodlife sites are separate branches, beyond what the two pages say.

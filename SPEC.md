# SPEC: Elite Digital Dynamics website

Written with `build-premium-website`. Source of truth for structure and words. Values (colour, type, spacing, motion) are in `DESIGN.md`. Contracts are in `docs/ARCHITECTURE.md`.

## 1. Brief in six lines
- **Audience:** owners of local businesses in Pune (gyms, salons, hotels, clinics), on a phone, deciding in seconds.
- **Promise:** we make your business the easy choice online: a site, app or automation that looks premium and works.
- **Proof:** three live client sites the visitor can scroll right on the page, and a working demo of an app we built.
- **Primary action:** "Start a project" (scrolls to the enquiry form). Secondary: WhatsApp and call.
- **Tone:** plain, confident, local. Short sentences. No agency jargon, no invented proof.
- **Signature:** the live ring object behind the page. It ends the page by settling into our logo.

## 2. Pages and sections

| # | Section | id | 3D pose | Notes |
|---|---|---|---|---|
| 1 | Navigation | (header) | n/a | sticky |
| 2 | Hero | `top` | `hero` | h1 |
| 3 | Services | `services` | `services` | five items |
| 4 | Our work: client sites | `work` | `work` | three live previews |
| 5 | Our work: SocialSync demo | `demo` | `demo` | interactive demo |
| 6 | How we work | `process` | `process` | five steps |
| 7 | FAQ | `faq` | `faq` | six questions |
| 8 | Enquiry + contact | `contact` | `contact` | form, logo moment |
| 9 | Footer | (footer) | n/a | |

Other routes: `/privacy`, 404. Both use the CSS glow only (no 3D).

## 3. Content map (final copy)

### Navigation
- Logo: horizontal lockup (mark only on phones). Accessible name "Elite Digital Dynamics, home".
- Links: Services, Work, Process, FAQ.
- Button: **Start a project** (to `#contact`).
- Phone: mark, "Start a project" button, menu button ("Menu" / "Close menu") opening the four links plus Call and WhatsApp.
- First focusable items on the page: "Skip to content", then "Pause background motion".

### Hero
- Eyebrow: `Digital agency in Pune`
- H1: **Make your business the easy choice online.**
- Line: Websites, apps and automation for local businesses: gyms, salons, hotels and clinics.
- Primary button: **Start a project**
- Secondary (ghost): **See our work** (to `#work`)
- Nothing else in the hero. The tagline lives at the logo moment in the contact section and in the footer lockup.

### Services
- No eyebrow. The numbers 01 to 05 label the five services themselves.
- H2: **Five things we do well.**
- Lead: Pick one, or let us put the right mix together for your business.

| No. | Name (exact) | Promise | What you get |
|---|---|---|---|
| 01 | Website Development | A phone-first website that makes people call, book or visit. | Designed around your business, not a template · Built for phones first and quick to load · Set up so Google and Maps show the right details |
| 02 | Custom App Development | When ready-made software does not fit how you work, we build what does. | Web and mobile apps for your team or your customers · Booking, scheduling, dashboards and internal tools · See SocialSync below, built for a Pune clinic |
| 03 | Automated Google Review Collection | Make it easy for your real customers to leave a real Google review. | A review link or QR code customers get after a visit · Polite reminders so the request is not forgotten · Help turning the customer's own words into a draft they can post |
| 04 | AI Video & Personalised Content | Short videos and content made for your business and your customers. | Promo and explainer videos made with AI tools · Content tailored to a customer, an offer or an occasion · Sized for Instagram, WhatsApp and YouTube |
| 05 | WhatsApp Automation | Reply, confirm and follow up on WhatsApp without typing the same message twice. | Instant replies to common questions · Booking confirmations and reminders · Follow-ups after a visit or an enquiry |

- Fixed note under service 03 (always visible, small): **Real customers, their own words. We never write, buy or filter reviews.**

### Our work: client sites
- No eyebrow.
- H2: **Work you can open right now.**
- Lead: Three live client websites and an app we built. Each site opens in a new tab.
- One link card per project (owner change, 2026-11-16): first-screen picture, name as h3, one line, city, 2 or 3 tags for what we built, label **Visit site** with an arrow. Client cards open `/visit/<slug>` in a new tab; the SocialSync card (**See the demo**) goes to `#demo`. No frames.
- Names, lines and tags: section 6 and `src/components/work/sites.data.json`.

### Our work: SocialSync demo
- Eyebrow: `App we built`
- H2: **SocialSync: one post, three platforms.**
- Body: A scheduling app we built for IPMH, a physiotherapy and osteopathy clinic in Pune. The team writes one post and publishes it to Instagram, a Facebook Page and YouTube together, now or at a set time in India time, then sees how each post performed.
- Second line: The real app is private, so this is a working demo with sample data. Watch it run, or take over and click through.
- Label on the demo (always visible): `Sample data, nothing is posted`
- Credit: `Built for IPMH, Pune`
- Controls: **Pause tour** / **Resume tour**, and four step chips: Create, Schedule, Published, Analytics. Phone frame on phones, laptop frame from 1024px wide.

### How we work
- No eyebrow. The numbers 01 to 05 label the steps.
- H2: **Five steps, no surprises.**

| No. | Step | Text |
|---|---|---|
| 01 | Understand | We start with a call or a visit: what you sell, who buys it, and what is not working today. |
| 02 | Design | You see the look and the words before we build. Change what you do not like. |
| 03 | Build | We build for phones first and show you progress as it takes shape. |
| 04 | Launch | We put it live, check it on real devices, and hand over what you need to run it. |
| 05 | Support | After launch we stay reachable for fixes, updates and the next thing you need. |

### FAQ
- No eyebrow.
- H2: **What owners ask us first.**

1. **How much will it cost?** It depends on what you need. A small website and a custom app are very different jobs. Tell us what you have in mind and we will give you a clear quote before any work starts.
2. **How long will it take?** A simple website is quicker than a custom app. Once we know the scope, the timeline comes with the quote, and we tell you early if anything changes it.
3. **Will it work well on phones?** Yes. Most of your customers will open it on a phone, so we design and test for phones first, then for bigger screens.
4. **I already have a website. Can you improve it?** Yes. We can redesign it, rebuild it, or add what is missing, such as WhatsApp automation or Google review collection.
5. **Are the Google reviews real?** Yes. We only make it easier for your real customers to leave a review in their own words: a link or QR code after their visit, and a reminder. We never write, buy or filter reviews. Google bans that, and so do we.
6. **What do you need from me to start?** A short conversation about your business, your logo and photos if you have them, and the details customers ask for most: services, timings, location and contact numbers. If your content is not ready, tell us and we will work out what is needed together.

### Enquiry and contact
- Above the heading: the logo stage (an empty square where the 3D rings land as the logo; it shows the 2D mark when the scene is off), then the tagline `Your Vision, Our Innovation` (small, salmon).
- H2: **Tell us what you are planning.**
- Lead: Fill this in, or call or WhatsApp us. We are in Shivaji Nagar, Pune.

Form fields (labels always visible, never placeholder-only):

| Field | Label | Required | Helper / options |
|---|---|---|---|
| name | Your name | yes | |
| phone | Phone number | yes | helper: Indian mobile number, 10 digits |
| email | Email | no | label shows "(optional)" |
| business | Business name | no | label shows "(optional)" |
| service | What do you need? | no | Choose one (default) · the five services · Not sure yet |
| message | Message | no | helper: A line or two about your business and what you want |

- Validation messages: `Enter your name.` · `Enter a 10-digit Indian mobile number, for example 98765 43210.` · `That email address does not look right.`
- Error summary heading: `Please fix the following before sending:`
- Under the button: `We use these details only to reply to your enquiry.` + link `Privacy`.

**Mode A, no access key (ships now):**
- Notice above the buttons: `This opens WhatsApp or your email app with your details filled in. Nothing is sent until you press send there.`
- Buttons: **Send on WhatsApp** (primary), **Send by email** (ghost).
- After WhatsApp: `WhatsApp opened with your message. Press send there to reach us.`
- After email: `Your email app opened with your message. Press send there to reach us.`
- Both keep a link: `Did nothing open? Call +91 92260 46693.`

**Mode B, access key present (later):**
- Button: **Send enquiry**. Pending: `Sending…`
- Success heading: `Thanks, {name}. Your enquiry is with us.` Body: `We will reply by phone or email.` Button: `Send another`.
- Failure: `That did not go through. Your details are still here. Try again, or send them on WhatsApp or by email.` with the Mode A buttons.

Contact block (beside the form on desktop, above it on phone):
- Call: `+91 92260 46693` and `+91 92845 07574` (tap to call)
- WhatsApp: **Chat on WhatsApp** (to 91 92260 46693)
- Email: `elitedigitaldynamics.26@gmail.com`
- Address: `102-B Devratna Apartment, Shirole Gali, Shivaji Nagar, Pune`

### Footer
- Stacked lockup (includes the tagline), plus visible text "Elite Digital Dynamics" for screen readers and search.
- Links: Services, Work, Process, FAQ, Start a project, Privacy.
- Contact repeat: first phone, email, address.
- Motion control: **Pause motion** / **Play motion**.
- Line: `© 2026 Elite Digital Dynamics, Pune.`

### Privacy page (`/privacy`)
- H1: **Privacy**
- Intro: This page says, in plain words, what this website does with your information.
- **What the enquiry form collects.** Your name and phone number, and, if you choose to give them, your email, business name, the service you are interested in and your message.
- **How it reaches us.** In one of two ways. (1) The form opens WhatsApp or your own email app with your details filled in; nothing leaves your device until you press send there. (2) Where the form sends directly, it uses Web3Forms, a form delivery service, which forwards your message to our email inbox.
- **What we use it for.** Only to reply to your enquiry and to talk about your project. We do not sell it or pass it to advertisers.
- **Live previews of client websites.** The "Our work" section loads real client websites inside this page. When a preview loads, your browser connects to that website directly, as if you had opened it, and that website may set its own cookies.
- **Cookies and tracking.** This website sets no cookies and runs no analytics or advertising trackers. It stores one setting in your browser, whether you paused the background motion, and that setting never leaves your device.
- **Hosting.** The site is hosted on Vercel. Like any web host, it processes technical data such as your IP address to deliver the pages.
- **Your choices.** To see, correct or delete the details you sent us, email elitedigitaldynamics.26@gmail.com or call +91 92260 46693.
- **Contact.** Elite Digital Dynamics, 102-B Devratna Apartment, Shirole Gali, Shivaji Nagar, Pune.
- Footer line: `Last updated: November 2026.`

### 404
- H1: **This page is not here.**
- Line: The link may be old or mistyped.
- Buttons: **Back to home**, **Start a project**.

### Metadata
- Title: `Elite Digital Dynamics | Websites, Apps & Automation in Pune`
- Title template for other pages: `%s | Elite Digital Dynamics`
- Description: `Pune digital agency building websites, custom apps, Google review collection, AI video and WhatsApp automation for local businesses.`
- OG title: `Elite Digital Dynamics`; OG description: `Websites, apps and automation for local businesses. Your Vision, Our Innovation.`
- Share image: 1200x630, dark background with the red glow, mark at left, company name in type, tagline. Alt: `Elite Digital Dynamics: two red rings around a glowing core. Your Vision, Our Innovation.`
- Structured data: `ProfessionalService` (a LocalBusiness type) with name, slogan, both phones, email, street address, locality Pune, region Maharashtra, country IN, area served Pune, logo, URL, and the five services as offers. **No** rating, price range, opening hours, geo coordinates, founding date or social profiles.

### Copy rules for every agent
- One label per intent: "Start a project" (contact), "See our work" (portfolio), "Open live site" (client site). No synonyms.
- No em dash or en dash in any visible text. Use a full stop, comma, colon or hyphen.
- At most one middle dot per line. No decorative status dots, no "scroll" cues, no version labels.
- Eyebrows appear twice on the home page only: hero and SocialSync.

## 4. Facts: real vs missing

| Fact | Status | Source / what the site does instead |
|---|---|---|
| Name, tagline, city | real | brief |
| Two phone numbers, email, WhatsApp number, address | real | brief |
| Five services and what the review service does | real | brief |
| Three client sites | real | brief + live sites (`docs/research/sites.md`) |
| SocialSync and its features, client IPMH | real | brief |
| Logo files | real | owner upload, `public/brand/` (`edd-mark-mono.svg` was not in the upload; derived from the mark) |
| Process steps and FAQ answers | written by us from the brief | owner should confirm the process promises (quote before work, phone-first testing, reachable after launch) |
| Production domain | **missing** | `NEXT_PUBLIC_SITE_URL`, falls back to the Vercel URL; needed for sitemap, canonical and share image |
| Web3Forms key | **missing (later)** | WhatsApp/email fallback ships |
| Testimonials, client count, years, awards, team, prices | **missing by rule** | not shown |
| Postal code, map coordinates, opening hours | **missing** | left out of address and structured data |
| Social media profiles | **missing** | no social icons |
| Business registration / GST | **missing** | not shown |

## 5. Scroll choreography (3D)

The object is our logo in 3D and nothing else: outer ring **A** and inner ring **B** (each an open band with a gap and round ends) turning in opposite directions around the glowing core.

| Pose | Rings | Object position, phone | Object position, desktop | Dim |
|---|---|---|---|---|
| hero | A and B tilted on different axes like a gyroscope; slow counter-turn | lower half of the screen, shifted right so it bleeds off the edge; headline above it | right 55% of the screen, large; headline left | 0 (full) |
| services | both rings flatten and face the viewer, concentric, still turning, cropped by the screen edge | low and centred, behind the panel | left third, half off-screen; list on the right | 0.55 |
| work | rings stand upright and rise from below as arcs behind the previews | bottom edge, only the upper arcs visible | bottom centre, wide arcs behind the frames | 0.6 |
| demo | small and calm in a corner; capped at 30fps | top right corner, small | top right, small | 0.75 |
| process | the object comes apart along one line: ring A, core, ring B side by side | along the left edge, top to bottom | in a row behind the steps | 0.6 |
| faq | small gyroscope to one side | top right, small | right edge | 0.65 |
| contact | **the logo**: A and B face the viewer in one plane, outer gap at top-right, inner gap at bottom-left, core glowing; turning stops and the rings settle exactly | lands on the logo stage above the heading | lands on the logo stage in the left column | 0.1 |

Rules:
- Text never sits on the bright core. Where a heading must cross the object, the scrim and the pose dim keep AA contrast.
- The contact pose is anchored to the **logo stage**, an empty square in the contact section. The rings fly to it as it scrolls into view, are fully settled when it reaches the middle of the screen, and stay attached to it as the page scrolls on. The logo pose holds still so it reads as the mark.
- When the scene is off (no WebGL, reduced motion, paused), the hero shows a still picture of the object and the logo stage shows the 2D mark.

## 6. Client sites (measured by the scout, full evidence in `docs/research/sites.md`)

| Order | Name (h3) | Line | City | Tags |
|---|---|---|---|---|
| 1 | Hotel Orient Elite | Hotel with rooms, a vegetarian restaurant, a rooftop cafe and an event hall. | Solapur | Website · WhatsApp booking form · Rooms and dining |
| 2 | Goodlife Fitness | Premium gym in Murarji Peth with boxing, yoga, steam and spa. | Solapur | Website · WhatsApp enquiry form · Facilities showcase |
| 3 | Goodlife Fitness Club | 24-hour weights and cardio gym at Sai Trade Center. | Solapur | Website · Call and WhatsApp bar · Trainer profiles |
| 4 | SocialSync | Scheduling app for IPMH, a physiotherapy and osteopathy clinic. | Pune | Custom web app · Instagram, Facebook and YouTube · Scheduled posts |

Every fact comes from `docs/research/sites.md` (what is on each page) or the brief (SocialSync). The pictures are the top 1280x800 of the scout's desktop captures, and the SocialSync picture is our own demo.

Frames were dropped by the owner: the client pages are heavy, frames trap scrolling, and visitors should stay on our site until they choose to leave.

The two Goodlife sites are different businesses' pages (different address, phone, hours and offer), and the first also calls itself "Goodlife Fitness Club" in its footer, so the captions carry the difference: place and purpose.

Not ours to fix but the owner should know: the hotel page weighs 41.3 MB and Goodlife Fitness Club 20.2 MB (multi-megabyte PNG photos). A prospect who opens them on mobile data waits.

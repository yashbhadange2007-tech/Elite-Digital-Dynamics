# Owner's brief (source of truth for every agent)

> **November 2026 update.** The owner replaced the real-time WebGL ring scene with a pre-rendered video sculpture and the red theme with navy, electric blue and hot pink. Everything in this file about three.js, React Three Fiber, quality tiers, the logo stage, `data-scene` and ring colours is history. Current truth: `DESIGN.md` (sections 1 to 3 and 9), `SPEC.md` section 5 and `src/components/sculpture/`.

Written by the owner of Elite Digital Dynamics. If anything in a skill disagrees with this file, this file wins.

## Context
Elite Digital Dynamics is a small digital agency in Pune, India. Tagline: "Your Vision Our Innovation". Buyers are business owners (gyms, salons, hotels, clinics). Most open links on a phone and decide in a few seconds whether we look premium or cheap. There is no website yet.

Visual reference: five screenshots of a template called DEVHAUS, at
`/tmp/claude-0/-home-user-Elite-Digital-Dynamics/ff53f3cc-0df7-51ca-8cac-2cf57e944bce/images/` (`1.png`, `2.png`, `3.webp`, `4.png`, `5.png`). Read them. The owner wants that look and the feeling of a live 3D object behind the page.

## The task
Design and build the complete, production-ready, one-page agency site (plus a privacy page and a 404), then verify it in a real browser.

Done means: every section below is built and responsive from 360px to wide desktop; the 3D scene moves smoothly on desktop and on a mid-range Android phone; the three client sites and the SocialSync demo work as described; the enquiry form handles success and failure; the production build passes with no console errors; screenshots have been compared with the reference and shortfalls fixed.

Stack: Next.js (App Router) with TypeScript, React Three Fiber for the 3D, current stable versions, deployable on Vercel.

## Look and feel
Sample the palette from the screenshots: near-black background, a soft red glow behind the object, deep red buttons, a bright red glowing core, white headings in a light-weight geometric sans, grey secondary text, dark frosted-glass panels with a hairline border and large corner radius, small numbered labels (01, 02, 03).

Keep the palette, materials and mood, but make the design ours: our own ring arrangement and choreography, our own layout and words. Do not reuse DEVHAUS's wording, logo or section-for-section layout, because it is another studio's design and visitors may recognise it.

No logo was supplied. Set the company name in type.

## The 3D scene (the centrepiece)
Several nested glossy metal rings, dark red with bright salmon-red highlights on their edges, turning slowly around a glowing red sphere. The scene stays fixed behind the page. As the visitor scrolls, glass panels slide over it and blur it, and the rings move into new arrangements (tilted like a gyroscope, then flat and concentric facing the viewer, then standing upright as arcs).

- Real-time 3D, not a video. It always drifts gently when idle, follows scroll, and reacts slightly to the pointer.
- All motion is eased and damped. No jumps or snaps, including on fast scrolling and when scroll direction reverses.
- Build reflections from lights and an environment generated in code, and self-host fonts and every asset. Some networks the owner works on block public CDNs, and a scene that fetches from one would show up broken.
- Page text renders and is usable before the 3D loads. Load the scene after first paint.
- Headings stay readable over the object at every scroll position.
- Phones matter most. Lower the quality automatically (resolution, geometry detail, effects) when the frame rate drops, and pause rendering when the tab is hidden.
- Reduced-motion setting: a still or nearly still scene. No WebGL: a static image of the scene.

## Sections, in order
1. Navigation: logo, section links, one "Start a project" button that scrolls to the form.
2. Hero: one strong headline, one line under it, primary button, the 3D object.
3. Services, five of them:
   - Website Development
   - Custom App Development
   - Automated Google Review Collection
   - AI Video & Personalised Content
   - WhatsApp Automation

   The review service helps a business's real customers leave real Google reviews (a link or QR after a visit, reminders, help turning the customer's own words into a draft). Do not write "review generation" or anything that suggests fake, paid or filtered reviews, because Google bans those and the wording would scare off buyers.
4. Our work: three live client sites and the SocialSync demo (details below).
5. How we work: a short, honest process (for example: understand, design, build, launch, support).
6. FAQ: five or six questions a business owner really asks.
7. Enquiry form and contact details.
8. Footer.

Also include what a professional agency site needs: page metadata, a social share image, favicon, sitemap, robots file, business structured data, a simple privacy page (the form collects personal data), keyboard access and WCAG AA contrast.

## Honesty rule
For claims about us, use only the facts in this brief. Leave out testimonials, client counts, years of experience, awards, team members and prices, because none are real and buyers check. If a section needs facts that were not given, skip it and list it for the final report.

## Our work: live client sites
1. Hotel Orient Elite: https://hotelorientelite.co.in
2. Goodlife Fitness: https://goodlife-fitness-website.vercel.app
3. Goodlife Fitness Club: https://goodlife-fitness-club.vercel.app

Open each site and write its name and one-line caption from what is really on the page. Make the two Goodlife entries clearly different (location or purpose). If a site cannot be opened, use the names above with a neutral caption and flag it.

Each site is shown live inside a device frame. The visitor scrolls the preview to browse the site, and a tap or click on it opens the real site in a new tab. The text ".vercel.app" must not be visible anywhere on our page; show the business name in the frame's address bar instead. It is fine inside the link itself.

How: a frame from another domain cannot report taps or be scrolled by script. So render each site in an iframe tall enough to show the whole page, with pointer events off, inside our own scrollable frame. Our frame then owns the scroll and the click.
- Known weakness: sections sized in viewport-height units stretch inside a tall iframe. Check each site in the browser. If one stretches or gets cut off, switch that site to a normal-height interactive iframe (the visitor scrolls the real site directly) with a clear "Open live site" button on the frame.
- If a site refuses to be framed at all, use a scrollable full-page screenshot in the same frame.
- A frame must not show a browser error page or an empty box in any case.
- Mount each iframe only when it nears the viewport, with a skeleton until it loads, so three live sites do not slow the first load.
- On touch screens, page scrolling must not get stuck inside a preview: keep previews shorter than the screen and let scroll pass to the page at the ends.
- Sandbox the iframes so an embedded site cannot navigate our page.

## Our work: SocialSync demo
SocialSync is a social-media scheduling app we built for IPMH, a physiotherapy and osteopathy clinic in Pune. The clinic team creates one post and publishes it to Instagram, a Facebook Page and YouTube together, now or at a scheduled time (India time), then sees how each post performed. The real app is private and behind a login, so do not link or embed it.

Build a self-contained interactive demo of it inside our site, in a phone frame and/or laptop frame, with made-up sample data and a visible label such as "Sample data, nothing is posted". Invent the sample posts and account names; do not use real people or real handles. Credit line: "Built for IPMH, Pune".

The demo plays itself as a short guided loop (create a post, schedule it, see it published, see analytics) and also lets the visitor click through the steps.

Facts, so it looks like the real product. It has its own light look, different from our dark site; keep that look inside the device frame.
- Logo: three nodes on one ring. SVG viewBox 0 0 64 64, no fill, stroke width 6, round caps. Arcs: "M40.13 13.73A20 20 0 0 1 51.89 34.09" (navy), "M43.76 48.18A20 20 0 0 1 20.24 48.18" (teal), "M12.11 34.09A20 20 0 0 1 23.87 13.73" (navy). Nodes, radius 6.5: (32,12) teal, (49.3,42) teal, (14.7,42) navy. On light: teal #116B72, navy #17324D. On dark: #48A9A3 and #F4F8FA.
- Colours: page #F4F6F8, white cards, text #14283B, accent teal #116B72, dark navy sidebar #12283D, a dark "stage" gradient #12283D to #0F3A4A to #0D565C, mint #7FD6CE for the main button on dark. Instagram #C4318B, Facebook #2867D4, YouTube #D9482B. Font: Figtree.
- Navigation: Home, Calendar, Posts, Analytics, Accounts, Settings, plus a "Create post" button. Sidebar on desktop, bottom tab bar on phone.
- Home: a greeting, and the next post on the dark stage with its picture and a live countdown.
- Create post: add a photo or video once, choose platforms, write the text (optional different text per platform, a YouTube title), choose "Post now" or "Schedule for later" (date and time in IST), preview per platform, publish. The logo ring animates as the post reaches each platform.
- Analytics: numbers per platform, and a "Compare platforms" view (average views, engagement rate, watch time, best day and time in IST, top posts).

## Enquiry form and contact
- Fields: name, phone, email, business name, service wanted (the five, or "Not sure yet"), message.
- Send submissions to elitedigitaldynamics.26@gmail.com through Web3Forms (free tier). The owner will create the access key and supply it as `NEXT_PUBLIC_WEB3FORMS_KEY`.
- Until the key exists the form must still work for the visitor: open a pre-filled email or WhatsApp message instead and say so.
- Clear success and failure messages, validation for Indian phone numbers, a honeypot field against spam.
- Beside the form: +91 92260 46693 and +91 92845 07574 as tap-to-call, the email, a WhatsApp chat button to 9226046693, and the address: 102-B Devratna Apartment, Shirole Gali, Shivaji Nagar, Pune.

## Verification the owner expects
Run the site and look at it in a real browser at 375, 768 and 1440 wide. Take screenshots, compare with the reference, fix what looks weaker. Check: no console errors, the scene renders and moves, each portfolio frame behaves as specified, the demo loop runs, the form shows both success and failure, keyboard navigation works, reduced-motion works, and the production build passes.

## Skill precedence (when skills disagree)
1. This brief.
2. The reference screenshots (dark background, red glow, glass panels, glossy rings). Any skill that dislikes this look loses.
3. build-premium-website for structure and flow.
4. ui-ux-pro-max for palette, type and pattern data, inside what the screenshots allow.
5. design-taste-frontend and frontend-design-skill for craft.
6. impeccable improves quality only. It does not change the palette, the 3D concept or the approved layout.
7. security overrides all of the above if a visual choice weakens safety.

A real conflict gets one line in `DESIGN.md`: which skill lost and why.

Apply `karpathy-guidelines` to all code: state assumptions, keep changes small, define how each piece is checked.

## Not allowed without the owner's approval
Merging into main; creating or changing Vercel projects, domains or environment variables; signing up for any service; anything that costs money; changing the client sites.

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { MotionToggle } from '@/components/ui/MotionToggle';
import { site } from '@/lib/site';
import { CTA, FOOTER, NAV_LINKS } from './content';

// Pill links pulled left by their own padding, so the text lines up with the column edge.
// The padding is small enough that the focus ring stays inside the phone gutter.
const LINK = 'ui-pill-link -ml-2 px-2';

/**
 * Footer (DESIGN.md 7, SPEC.md). Rendered by the root layout on every page, so links are `/#id`.
 * Stacked lockup (the Logo adds the company name as real text) and the tagline as text, links,
 * the contact repeat, then the bottom row: copyright line, Privacy and the motion control.
 * Hairline on top, no glass.
 */
export default function Footer() {
  return (
    <footer className="border-t border-hairline">
      <Container className="grid gap-y-10 py-12 md:grid-cols-12 md:gap-x-8 lg:py-16">
        <div className="md:col-span-12 lg:col-span-5">
          {/* The artwork is centred in a wider box: 21.7% of its width is empty on each side.
              The negative margin puts the visible lockup on the column edge. The box stops at
              196 of the artwork's 250 units, under "DIGITAL DYNAMICS": the tagline line drawn
              below it is a few pixels tall, so it is set as live text instead: eyebrow type,
              without the .ui-eyebrow class (the page has exactly one eyebrow). */}
          <div className="h-[94px] overflow-hidden lg:h-[118px]">
            <Logo
              variant="stacked"
              loading="lazy"
              className="-ml-[44px] h-[120px] w-auto max-w-none lg:-ml-[55px] lg:h-[150px]"
            />
          </div>
          <p className="pt-3 text-eyebrow text-blue-300">{site.taglineDisplay}</p>
        </div>

        <nav aria-label="Footer" className="md:col-span-4 lg:col-span-3">
          {/* Two columns on phones keep the footer shorter than the screen under the nav, so the
              lockup clears the sticky nav at the end of the page. */}
          <ul className="grid grid-cols-2 justify-items-start gap-x-6 gap-y-2 md:grid-cols-1">
            {[...NAV_LINKS, CTA].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={LINK}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <address className="grid content-start justify-items-start gap-2 not-italic md:col-span-8 lg:col-span-4">
          <a href={site.phones[0].tel} className={LINK}>
            {site.phones[0].display}
          </a>
          <a href={site.mailto} className={LINK}>
            {site.email}
          </a>
          <p className="pt-2 text-text-muted">{site.address.full}</p>
        </address>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline pt-6 md:col-span-12">
          <p className="text-small text-text-muted">{FOOTER.line}</p>
          <Link href={FOOTER.privacy.href} className={LINK}>
            {FOOTER.privacy.label}
          </Link>
          <MotionToggle className="-ml-2 px-2 sm:ml-auto" />
        </div>
      </Container>
    </footer>
  );
}

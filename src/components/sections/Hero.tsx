import { ArrowDown } from '@phosphor-icons/react/dist/ssr/ArrowDown';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { WhatsappLogo } from '@phosphor-icons/react/dist/ssr/WhatsappLogo';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { waLink } from '@/lib/site';
import { CTA, HERO } from './content';

/**
 * Hero (DESIGN.md 8, SPEC.md). The first screen says what we do and how to reach us: eyebrow, the
 * page's only h1, one line, the pink "Start a project" button, a WhatsApp button and a link down
 * to the work. The section slides under the sticky nav so it fills exactly one screen. The text
 * is one block on a text scrim: top on phones (the sculpture sits under it), the left 7 of 12
 * columns on desktop. Server-rendered and never revealed: the h1 is among the largest paints.
 */
export default function Hero() {
  return (
    <section
      id="top"
      data-pose="hero"
      aria-labelledby="top-title"
      className="-mt-(--nav-h) min-h-svh pt-[calc(var(--nav-h)+clamp(1.5rem,6vw,5rem))] pb-12"
    >
      <Container className="lg:grid lg:grid-cols-12 lg:gap-x-8">
        {/* A stronger text scrim than the shared one: full strength to 60% of the way out and
            wider on the desktop's right, where the end of the h1 meets the sculpture's rings. */}
        <div className="text-scrim flex max-w-text flex-col items-start gap-4 before:inset-y-[-20%] before:bg-[radial-gradient(closest-side,rgb(5_7_13/0.78)_60%,transparent)] lg:col-span-7 lg:gap-6 lg:before:right-[-20%]">
          <Eyebrow>{HERO.eyebrow}</Eyebrow>
          <Heading level={1} id="top-title">
            {HERO.title}
          </Heading>
          <p className="ui-lead text-balance">{HERO.line}</p>
          <div className="mt-2 flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <Button href="#contact" size="lg" icon={<ArrowRight className="max-sm:hidden" />} className="max-sm:grow max-sm:px-4">
              {CTA.label}
            </Button>
            <Button
              href={waLink()}
              external
              size="lg"
              variant="ghost"
              icon={<WhatsappLogo />}
              className="max-sm:grow max-sm:px-4"
            >
              {HERO.whatsapp}
            </Button>
            <a href={HERO.work.href} className="ui-link inline-flex min-h-11 items-center gap-2 pr-2 font-medium max-sm:w-full sm:pl-2">
              {HERO.work.label}
              <ArrowDown aria-hidden="true" className="size-5" />
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}

import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { CTA, HERO } from './content';

/**
 * Hero (DESIGN.md 8, SPEC.md): eyebrow, the page's only h1, one line and two buttons, nothing else.
 * The section slides under the sticky nav so it fills exactly one screen. The text is one block
 * on a text scrim: top on phones (the object owns the lower part of the screen), the left 7 of 12
 * columns on desktop. Server-rendered and never revealed: the h1 is the largest paint.
 */
export default function Hero() {
  return (
    <section
      id="top"
      data-pose="hero"
      aria-labelledby="top-title"
      className="-mt-(--nav-h) min-h-svh pt-[calc(var(--nav-h)+clamp(2rem,6vw,5rem))] pb-12"
    >
      <Container className="lg:grid lg:grid-cols-12 lg:gap-x-8">
        <div className="text-scrim flex max-w-text flex-col items-start gap-4 lg:col-span-7 lg:gap-6">
          <Eyebrow>{HERO.eyebrow}</Eyebrow>
          <Heading level={1} id="top-title">
            {HERO.title}
          </Heading>
          <p className="ui-lead text-balance">{HERO.line}</p>
          <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button href="#contact" size="lg" icon={<ArrowRight />}>
              {CTA.label}
            </Button>
            <Button href={HERO.secondary.href} size="lg" variant="ghost">
              {HERO.secondary.label}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

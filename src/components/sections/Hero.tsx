import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';

/**
 * STUB (foundation). Agent C replaces this with the real hero (DESIGN.md 8, SPEC.md).
 * Default export. Keeps id `top`, pose `hero` and the page's only h1.
 */
export default function Hero() {
  return (
    <Section
      id="top"
      pose="hero"
      headingLevel={1}
      eyebrow="Digital agency in Pune"
      title="Make your business the easy choice online."
      lead="Websites, apps and automation for Pune's local businesses: gyms, salons, hotels and clinics."
      className="min-h-svh"
      headerClassName="max-w-text"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button href="#contact" size="lg" icon={<ArrowRight />}>
          Start a project
        </Button>
        <Button href="#work" size="lg" variant="ghost">
          See our work
        </Button>
      </div>
      <p className="mt-8 text-small text-text-muted">Stub: agent C builds the hero.</p>
    </Section>
  );
}

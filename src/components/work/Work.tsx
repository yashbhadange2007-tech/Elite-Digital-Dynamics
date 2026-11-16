import { ArrowDown } from '@phosphor-icons/react/dist/ssr/ArrowDown';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr/ArrowUpRight';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Heading } from '@/components/ui/Heading';
import { Section } from '@/components/ui/Section';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import sites from './sites.data.json';

type Card = {
  slug: string;
  href: string;
  external: boolean;
  name: string;
  line: string;
  city: string;
  tags: string[];
  action: string;
  icon: ReactNode;
};

/** Client sites open through `/visit/<slug>` (next.config.ts), so no hosting domain ever shows. */
const CARDS: Card[] = [
  ...sites.map((s) => ({
    slug: s.slug,
    href: `/visit/${s.slug}`,
    external: true,
    name: s.name,
    line: s.line,
    city: s.city,
    tags: s.tags,
    action: 'Visit site',
    icon: <ArrowUpRight aria-hidden />,
  })),
  {
    // No public site (the real app needs a login): the card goes to the demo just below.
    slug: 'socialsync',
    href: '#demo',
    external: false,
    name: 'SocialSync',
    line: 'Scheduling app for IPMH, a physiotherapy and osteopathy clinic.',
    city: 'Pune',
    tags: ['Custom web app', 'Instagram, Facebook and YouTube', 'Scheduled posts'],
    action: 'See the demo',
    icon: <ArrowDown aria-hidden />,
  },
];

/** "Our work": one link card per project. The whole card is the link. */
export default function Work() {
  return (
    <Section
      id="work"
      pose="work"
      title="Work you can open right now."
      lead="Three live client websites and an app we built. Each site opens in a new tab."
    >
      <ul className="grid gap-6 md:grid-cols-2 lg:gap-8">
        {CARDS.map((card) => (
          <li key={card.slug} className="grid">
            <a
              href={card.href}
              {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              data-work-card={card.slug}
              className="ui-glass group flex flex-col gap-4 rounded-panel p-4 transition-colors duration-2 hover:border-hairline-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus md:p-5"
            >
              <Image
                src={`/work/${card.slug}.webp`}
                alt={`First screen of ${card.name}`}
                width={960}
                height={600}
                sizes="(min-width: 48rem) 50vw, 100vw"
                className="aspect-[16/10] w-full rounded-card border border-hairline object-cover object-top"
              />
              <div className="flex flex-1 flex-col gap-2 px-1">
                <Heading level={3}>{card.name}</Heading>
                <p className="text-text-muted">
                  {card.line} <span className="text-text">{card.city}.</span>
                </p>
                <ul className="mt-1 flex flex-wrap gap-2" aria-label="What we built">
                  {card.tags.map((tag) => (
                    <li key={tag} className="rounded-pill border border-hairline px-3 py-1 text-small text-text-muted">
                      {tag}
                    </li>
                  ))}
                </ul>
                <span className="mt-auto inline-flex min-h-11 self-start pt-2 items-center gap-2 font-medium text-salmon">
                  {card.action}
                  <span className="transition-transform duration-2 group-hover:translate-x-0.5 [&_svg]:size-5">{card.icon}</span>
                  {card.external ? <VisuallyHidden> (opens in new tab)</VisuallyHidden> : null}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr/ArrowUpRight';
import { WhatsappLogo } from '@phosphor-icons/react/dist/ssr/WhatsappLogo';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { DeviceFrame } from '@/components/ui/DeviceFrame';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Heading } from '@/components/ui/Heading';
import { Logo } from '@/components/ui/Logo';
import { MotionToggle } from '@/components/ui/MotionToggle';
import { NumberLabel } from '@/components/ui/NumberLabel';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { NOT_SURE, SERVICES } from '@/lib/services';
import { site, waLink } from '@/lib/site';
import { GlassModeToggle } from './GlassModeToggle';

/**
 * /preview/primitives (development only, never built for production).
 * Every ui primitive in every state, on the page glow, with a switch between the two glass modes.
 */
export const metadata: Metadata = { title: 'Preview: primitives' };

const COLOURS: [token: string, value: string][] = [
  ['bg', '#080505'],
  ['ember-950', '#140606'],
  ['ember-900', '#2A0A07'],
  ['ember-800', '#4A0F0A'],
  ['ember-700', '#7A140D'],
  ['ember-600', '#A32012'],
  ['ember-500', '#C42415'],
  ['ember-400', '#FF3B1F'],
  ['ember-300', '#FF6A4D'],
  ['salmon', '#FF8A6B'],
  ['hot', '#FFD9CC'],
  ['text', '#F6F1EF'],
  ['text-muted', '#C4B9B6'],
  ['focus', '#FFD9CC'],
  ['error', '#FFA391'],
  ['success', '#86D6A8'],
  ['hairline', 'white / 0.10'],
  ['hairline-strong', 'salmon / 0.32'],
];

const TYPE: [size: 'display' | 'h2' | 'h3', note: string][] = [
  ['display', 'display, 38 to 68px, weight 300'],
  ['h2', 'h2, 28 to 48px, weight 300'],
  ['h3', 'h3, 20 to 26px, weight 400'],
];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 border-b border-hairline py-6 last:border-b-0 md:grid-cols-[14rem_1fr] md:items-center md:gap-6">
      <p className="text-small text-text-muted">{label}</p>
      <div className="flex min-w-0 flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function SampleScreen({ name }: { name: string }) {
  return (
    <div role="region" aria-label={`${name}: sample screen`} tabIndex={0} className="overflow-y-auto bg-white text-[#14283B]">
      <div className="bg-[#12283D] px-5 py-8 text-white">
        <p className="text-small">{name}</p>
        <p className="mt-2 text-h3">Sample screen content</p>
      </div>
      <div className="grid gap-4 p-5">
        {['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'].map((item) => (
          <div key={item} className="rounded-card border border-[#14283B]/15 p-4">
            <p className="font-medium">Block {item}</p>
            <p className="mt-1 text-small">Scroll inside the frame. The page scrolls on when the end is reached.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PrimitivesPreview() {
  return (
    <main id="main">
      <Section
        id="intro"
        headingLevel={1}
        eyebrow="Foundation"
        title="Primitives"
        lead="Every shared building block in every state. Press Tab to see the skip links and the focus ring."
      >
        <div className="flex flex-wrap items-center gap-3">
          <GlassModeToggle />
          <MotionToggle />
        </div>
      </Section>

      <Section id="colour" title="Colour tokens" lead="One accent family, ember red to salmon. Nothing else is coloured.">
        <ul role="list" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {COLOURS.map(([token, value]) => (
            <li key={token} className="rounded-card border border-hairline p-3">
              <div
                className="h-12 rounded-[0.5rem] border border-hairline"
                style={
                  token.startsWith('hairline')
                    ? { borderColor: `var(--color-${token})`, borderWidth: 2 }
                    : { backgroundColor: `var(--color-${token})` }
                }
              />
              <p className="mt-2 text-small">{token}</p>
              <p className="text-small text-text-muted">{value}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="type" title="Type scale" lead="Manrope variable, self-hosted. Headings at weight 300, body at 400, labels at 500.">
        <div>
          {TYPE.map(([size, note]) => (
            <Row key={size} label={note}>
              <Heading level={3} size={size}>
                Make it the <strong>easy</strong> choice
              </Heading>
            </Row>
          ))}
          <Row label="lead, 17 to 20px">
            <p className="ui-lead">Websites, apps and automation for local businesses in Pune.</p>
          </Row>
          <Row label="body, 16px, line height 1.6">
            <p className="max-w-measure">
              Body copy is capped at 62 characters per line, wraps prettily and never goes below 16px. Secondary
              text uses the muted colour.
            </p>
          </Row>
          <Row label="small, 14px">
            <p className="text-small text-text-muted">Helper text, captions and notes.</p>
          </Row>
          <Row label="eyebrow and number label, 13px">
            <Eyebrow>Digital agency in Pune</Eyebrow>
            {[1, 2, 3, 4, 5].map((n) => (
              <NumberLabel key={n} n={n} />
            ))}
          </Row>
        </div>
      </Section>

      <Section id="buttons" title="Buttons" lead="Pill, one line always, 44px or 52px high.">
        <div>
          <Row label="primary: md, lg">
            <Button href="#buttons">Start a project</Button>
            <Button href="#buttons" size="lg">
              Start a project
            </Button>
          </Row>
          <Row label="ghost: md, lg">
            <Button href="#buttons" variant="ghost">
              See our work
            </Button>
            <Button href="#buttons" variant="ghost" size="lg">
              See our work
            </Button>
          </Row>
          <Row label="trailing icon (moves 2px on hover)">
            <Button href="#buttons" size="lg" icon={<ArrowRight />}>
              Start a project
            </Button>
            <Button href="/visit/hotel-orient-elite" external variant="ghost" icon={<ArrowUpRight />}>
              Open live site
            </Button>
            <Button href={waLink()} external variant="ghost" icon={<WhatsappLogo />}>
              Chat on WhatsApp
            </Button>
          </Row>
          <Row label="button element">
            <Button>Send enquiry</Button>
            <Button variant="ghost">Send another</Button>
          </Row>
          <Row label="disabled or pending (aria-disabled)">
            <Button disabled>Sending…</Button>
            <Button disabled variant="ghost">
              Send by email
            </Button>
          </Row>
          <Row label="full width on phones">
            <Button href="#buttons" size="lg" className="w-full sm:w-auto">
              Send on WhatsApp
            </Button>
          </Row>
          <Row label="too narrow: ellipsis, never two lines">
            <div className="w-40">
              <Button href="#buttons" variant="ghost">
                A label that is far too long
              </Button>
            </div>
          </Row>
        </div>
      </Section>

      <Section
        id="glass"
        title="Glass panels"
        lead="Lite by default. Only a primary panel blurs, and only while real glass is on."
      >
        <div className="relative isolate grid gap-6 lg:grid-cols-2">
          {/* Something bright behind the primary panel, so the two glass modes can be told apart. */}
          <div aria-hidden="true" className="pointer-events-none absolute top-6 left-[12%] -z-10 lg:left-[22%]">
            <Logo variant="mark" decorative height={260} />
          </div>
          <GlassPanel primary>
            <Heading level={3}>Primary panel</Heading>
            <p className="mt-3 text-text-muted">
              Blur 22px with the 0.64 fill in real mode, the 0.86 fill without blur in lite mode. Hairline border,
              inner highlight, top sheen and one soft shadow in both.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <GlassPanel tone="flat">
                <p className="font-medium">Flat tile</p>
                <p className="mt-1 text-small text-text-muted">Cards inside a panel are flat, never glass.</p>
              </GlassPanel>
              <GlassPanel tone="flat">
                <p className="font-medium">Flat tile</p>
                <p className="mt-1 text-small text-text-muted">Faint fill, hairline, card radius.</p>
              </GlassPanel>
            </div>
          </GlassPanel>
          <GlassPanel>
            <Heading level={3}>Panel</Heading>
            <p className="mt-3 text-text-muted">
              Every panel that is not primary stays lite in both modes, so at most one panel and the nav blur at
              a time.
            </p>
          </GlassPanel>
        </div>
      </Section>

      <Section
        id="labels"
        eyebrow="Eyebrow: sentence case, salmon"
        title="Section header with number labels"
        lead="The header is stacked and left aligned: eyebrow, heading, then the lead under it."
      >
        <GlassPanel>
          <ol role="list">
            {SERVICES.map((service, index) => (
              <li
                key={service.id}
                className="grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 border-b border-hairline py-5 first:pt-0 last:border-b-0 last:pb-0"
              >
                <NumberLabel n={index + 1} aria-hidden />
                <Heading level={3}>{service.name}</Heading>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-small text-text-muted">Form option: {NOT_SURE}</p>
        </GlassPanel>
      </Section>

      <Section id="frames" title="Device frames" lead="The address bar shows the business name, never a URL.">
        <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
          <DeviceFrame variant="laptop" addressLabel="Hotel Orient Elite">
            <SampleScreen name="Laptop frame" />
          </DeviceFrame>
          <DeviceFrame variant="phone" addressLabel="Goodlife Fitness" className="mx-auto">
            <SampleScreen name="Phone frame" />
          </DeviceFrame>
        </div>
      </Section>

      <Section id="links" title="Links and quiet controls">
        <div>
          <Row label="text link (.ui-link)">
            <a className="ui-link" href={site.phones[0].tel}>
              {site.phones[0].display}
            </a>
            <a className="ui-link" href={site.mailto}>
              {site.email}
            </a>
          </Row>
          <Row label="ExternalLink (new tab, screen reader note)">
            <ExternalLink className="ui-link" href="/visit/goodlife-fitness">
              Goodlife Fitness
            </ExternalLink>
          </Row>
          <Row label="pill link (.ui-pill-link)">
            <a className="ui-pill-link" href="#links">
              Services
            </a>
            <a className="ui-pill-link" href="#links">
              Work
            </a>
            <MotionToggle />
          </Row>
          <Row label="VisuallyHidden">
            <p>
              Call us
              <VisuallyHidden> on {site.phones[0].display}</VisuallyHidden>
              <span className="text-text-muted"> (the number is read out, not shown)</span>
            </p>
          </Row>
        </div>
      </Section>

      <Section id="logo" title="Logo" lead="Brand files from public/brand. The company name is always next to it as text.">
        <div>
          <Row label="horizontal, 32px (nav, desktop)">
            <Logo variant="horizontal" />
          </Row>
          <Row label="mark, 36px (nav, phones)">
            <Logo variant="mark" />
          </Row>
          <Row label="stacked, 120px (footer)">
            <Logo variant="stacked" />
          </Row>
          <Row label="mono, current colour">
            <span className="text-salmon">
              <Logo variant="mono" height={36} />
            </span>
            <Logo variant="mono" height={36} />
          </Row>
        </div>
      </Section>

      <Section id="reveal" title="Reveal" lead="Opacity and a 16px rise, once. Visible without JavaScript and when motion is paused.">
        <Reveal>
          <GlassPanel>
            <p>One block, revealed as a whole.</p>
          </GlassPanel>
        </Reveal>
        <Reveal stagger as="ul" className="mt-6 grid gap-3 sm:grid-cols-3">
          {['First', 'Second', 'Third'].map((item) => (
            <li key={item}>
              <GlassPanel tone="flat">
                <p className="font-medium">{item}</p>
                <p className="mt-1 text-small text-text-muted">Staggered by 60ms.</p>
              </GlassPanel>
            </li>
          ))}
        </Reveal>
      </Section>

      <Section id="scrim" align="center" title="Text scrim" lead="For text that sits over the object without a panel.">
        <div className="text-scrim mx-auto max-w-text py-10 text-center">
          <Heading level={3}>A soft dark halo keeps this readable over the glow.</Heading>
          <p className="mt-3 text-text-muted">The only centred heading on the real page is in the contact section.</p>
        </div>
      </Section>
    </main>
  );
}

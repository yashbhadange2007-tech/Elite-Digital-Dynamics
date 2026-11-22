import { GlassPanel } from '@/components/ui/GlassPanel';
import { Heading } from '@/components/ui/Heading';
import { NumberLabel } from '@/components/ui/NumberLabel';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { SERVICES } from '@/lib/services';
import { SERVICE_DETAILS, SERVICES_HEAD } from './content';

/**
 * Services (DESIGN.md 8, SPEC.md): ONE primary glass panel holding a numbered index of the five
 * services. Every row is open: number, name and promise, then the three deliverables as a list.
 * The rows are revealed, never the panel (a blurred element must not animate).
 */
export default function Services() {
  return (
    <Section id="services" pose="services" title={SERVICES_HEAD.title} lead={SERVICES_HEAD.lead}>
      <GlassPanel primary>
        <Reveal as="ol" stagger>
          {SERVICES.map((service, index) => {
            const { promise, deliverables, note } = SERVICE_DETAILS[service.id];
            return (
              <li
                key={service.id}
                className="grid gap-x-8 gap-y-4 border-b border-hairline py-8 first:pt-0 last:border-b-0 last:pb-0 md:grid-cols-12 md:gap-y-6 lg:py-10"
              >
                <NumberLabel n={index + 1} aria-hidden className="md:col-span-12 lg:col-span-1 lg:pt-2" />
                <div className="grid content-start gap-2 md:col-span-6 lg:col-span-5">
                  <Heading level={3}>{service.name}</Heading>
                  <p className="max-w-[40ch] text-text-muted">{promise}</p>
                </div>
                <div className="grid content-start gap-4 md:col-span-6 lg:pt-1">
                  <ul className="grid list-disc gap-2 pl-5 marker:text-blue">
                    {deliverables.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {note ? <p className="text-small font-medium text-blue-300">{note}</p> : null}
                </div>
              </li>
            );
          })}
        </Reveal>
      </GlassPanel>
    </Section>
  );
}

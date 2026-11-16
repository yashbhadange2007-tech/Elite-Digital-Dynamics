import { Heading } from '@/components/ui/Heading';
import { NumberLabel } from '@/components/ui/NumberLabel';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { PROCESS } from './content';

/**
 * How we work (DESIGN.md 8, SPEC.md): five steps hanging off one rail. The rail is each step's
 * own border, so it is a salmon-tinted line down the left on phones and one hairline across the
 * top from 1024px. No cards, no glass; the text scrim keeps the steps readable over the object.
 */
export default function Process() {
  return (
    <Section id="process" pose="process" title={PROCESS.title}>
      <Reveal as="ol" stagger className="text-scrim lg:grid lg:grid-cols-5">
        {PROCESS.steps.map((step, index) => (
          <li
            key={step.name}
            className="grid content-start gap-2 border-l border-hairline-strong pb-10 pl-6 last:pb-0 lg:border-t lg:border-l-0 lg:pt-6 lg:pr-8 lg:pb-0 lg:pl-0"
          >
            <NumberLabel n={index + 1} aria-hidden />
            <Heading level={3}>{step.name}</Heading>
            <p className="text-text-muted">{step.text}</p>
          </li>
        ))}
      </Reveal>
    </Section>
  );
}

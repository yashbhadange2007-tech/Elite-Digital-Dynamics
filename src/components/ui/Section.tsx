import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { PoseId } from '@/lib/scroll-store';
import { Container } from './Container';
import { Eyebrow } from './Eyebrow';
import { Heading } from './Heading';

export type SectionProps = {
  /** Anchor id, e.g. `services`. The heading gets `${id}-title`. */
  id: string;
  /** The 3D pose this section stands for. Emitted as `data-pose`, read by the scroll store. */
  pose?: PoseId;
  /** Block at the very top of the header, above the eyebrow (the contact section's logo stage). */
  above?: ReactNode;
  /** Small salmon line above the heading (hero, SocialSync, and the tagline in contact). */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** One paragraph under the heading (muted, at most 62ch). */
  lead?: ReactNode;
  /** Default 2. Use 1 only for the hero. */
  headingLevel?: 1 | 2 | 3;
  /** Default `start`. `center` is for the contact section on phones only. */
  align?: 'start' | 'center';
  /** Class on the `<section>`. */
  className?: string;
  /** Class on the inner container, e.g. a desktop grid that puts the header beside the content. */
  containerClassName?: string;
  /** Class on the header block (eyebrow, heading, lead). */
  headerClassName?: string;
  children?: ReactNode;
};

/**
 * A page section: `<section>` with the anchor id, the pose marker, the fluid block padding and a
 * stacked header inside the page container. Anchor jumps clear the nav through the global
 * `scroll-padding-top`.
 */
export function Section({
  id,
  pose,
  above,
  eyebrow,
  title,
  lead,
  headingLevel = 2,
  align = 'start',
  className,
  containerClassName,
  headerClassName,
  children,
}: SectionProps) {
  const titleId = `${id}-title`;
  return (
    <section
      id={id}
      data-pose={pose}
      data-align={align}
      aria-labelledby={titleId}
      className={cn('ui-section', className)}
    >
      <Container className={containerClassName}>
        <header className={cn('ui-section-header', headerClassName)}>
          {above}
          {/* The text sits on the scene without a panel, so it gets the text scrim (DESIGN.md 3).
              `above` stays outside it: the contact logo stage is where the rings land, undimmed. */}
          <div className="ui-section-header-text text-scrim">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            <Heading level={headingLevel} id={titleId}>
              {title}
            </Heading>
            {lead ? <p className="ui-lead">{lead}</p> : null}
          </div>
        </header>
        {children}
      </Container>
    </section>
  );
}

import { Logo } from '@/components/ui/Logo';
import { Section } from '@/components/ui/Section';

/**
 * STUB (foundation). Agent E replaces this with the enquiry form and the contact block
 * (docs/ARCHITECTURE.md section 6). Default export. Keeps id `contact` and this h2.
 *
 * The logo stage is a contract with the scene (ARCHITECTURE.md section 9, item 13): one empty
 * square with `data-logo-stage` and `data-pose="contact"`, 168px on phones and 220px from 1024px.
 * It is the pose anchor, so the Section itself has no `pose`. The 2D mark inside is the fallback
 * and hides only while the scene is live.
 */
export default function Contact() {
  return (
    <Section
      id="contact"
      title="Tell us what you are planning."
      above={
        <div data-logo-stage data-pose="contact" className="size-[168px] lg:size-[220px]">
          <Logo variant="mark" decorative loading="lazy" className="size-full scene-live:invisible" />
        </div>
      }
    >
      <p className="text-small text-text-muted">
        Stub: agent E builds the enquiry form and the contact block.
      </p>
    </Section>
  );
}

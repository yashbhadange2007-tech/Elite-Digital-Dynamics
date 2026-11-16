import { GlassPanel } from '@/components/ui/GlassPanel';
import { Logo } from '@/components/ui/Logo';
import { Section } from '@/components/ui/Section';
import { site } from '@/lib/site';
import { ContactBlock } from './ContactBlock';
import { EnquiryForm, type EnquiryFormProps } from './EnquiryForm';

/**
 * Enquiry and contact (SPEC.md, DESIGN.md 8). The section has no pose: the logo stage carries
 * `data-pose="contact"` and is where the 3D rings land as the logo (ARCHITECTURE.md 9.13).
 * Phones: header centred, then the contact block, then the form. From 1024px: header and contact
 * block in the left 5 columns, the form in the right 7.
 */
export default function Contact({
  accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY,
  timeoutMs,
}: EnquiryFormProps) {
  return (
    <Section
      id="contact"
      above={
        <div data-logo-stage data-pose="contact" className="size-[168px] lg:size-[220px]">
          <Logo variant="mark" decorative loading="lazy" className="size-full scene-live:invisible" />
        </div>
      }
      eyebrow={site.taglineDisplay}
      title="Tell us what you are planning."
      lead="Fill this in, or call or WhatsApp us. We are in Shivaji Nagar, Pune."
      containerClassName="lg:grid lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-12"
      headerClassName="max-lg:justify-items-center max-lg:text-center lg:col-span-5"
    >
      <ContactBlock className="mb-12 lg:col-span-5 lg:row-start-2 lg:mb-0" />
      <GlassPanel primary className="lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
        <EnquiryForm accessKey={accessKey} timeoutMs={timeoutMs} />
      </GlassPanel>
    </Section>
  );
}

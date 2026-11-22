import { GlassPanel } from '@/components/ui/GlassPanel';
import { Logo } from '@/components/ui/Logo';
import { Section } from '@/components/ui/Section';
import { site } from '@/lib/site';
import { ContactBlock } from './ContactBlock';
import { EnquiryForm, type EnquiryFormProps } from './EnquiryForm';

/**
 * Enquiry and contact (SPEC.md, DESIGN.md 8). The logo mark above the heading carries
 * `data-pose="contact"`, the scroll anchor for the sculpture's last pose.
 * Phones: header, then the contact block, then the form. From 1024px: header and contact
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
        <div data-pose="contact" className="size-16 lg:size-20">
          <Logo variant="mark" decorative loading="lazy" className="size-full" />
        </div>
      }
      eyebrow={site.taglineDisplay}
      title="Tell us what you are planning."
      lead="Fill this in, or call or WhatsApp us. We are in Shivaji Nagar, Pune."
      containerClassName="lg:grid lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-12"
      headerClassName="lg:col-span-5"
    >
      <ContactBlock className="mb-12 lg:col-span-5 lg:row-start-2 lg:mb-0" />
      <GlassPanel primary className="lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
        <EnquiryForm accessKey={accessKey} timeoutMs={timeoutMs} />
      </GlassPanel>
    </Section>
  );
}

import type { Metadata } from 'next';
import Contact from '@/components/contact/Contact';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';

/**
 * Preview route for agent E: /preview/contact (development only, never built for production).
 * It imports only this area's entry, so another area's compile error cannot break it.
 */
export const metadata: Metadata = { title: 'Preview: enquiry form and contact' };

export default function ContactPreview() {
  return (
    <main id="main">
      <VisuallyHidden as="div">
        <h1>Preview: enquiry form and contact</h1>
      </VisuallyHidden>
      <Contact />
    </main>
  );
}

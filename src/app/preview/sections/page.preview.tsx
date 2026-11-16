import type { Metadata } from 'next';
import Faq from '@/components/sections/Faq';
import Hero from '@/components/sections/Hero';
import Process from '@/components/sections/Process';
import Services from '@/components/sections/Services';

/**
 * Preview route for agent C: /preview/sections (development only, never built for production).
 * It imports only this area's entries, so another area's compile error cannot break it.
 * Nav and Footer come from the root layout. The hero carries the h1.
 */
export const metadata: Metadata = { title: 'Preview: sections' };

export default function SectionsPreview() {
  return (
    <main id="main">
      <Hero />
      <Services />
      <Process />
      <Faq />
    </main>
  );
}

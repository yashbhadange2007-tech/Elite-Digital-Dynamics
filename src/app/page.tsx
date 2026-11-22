import Contact from '@/components/contact/Contact';
import Faq from '@/components/sections/Faq';
import Hero from '@/components/sections/Hero';
import Process from '@/components/sections/Process';
import Services from '@/components/sections/Services';
import SculptureLayer from '@/components/sculpture/SculptureLayer';
import SocialSyncShowcase from '@/components/socialsync/SocialSyncShowcase';
import Work from '@/components/work/Work';

/**
 * The home page: the sculpture layer, then the sections in reading order (what we do, proof,
 * how we work, questions, contact).
 * Nav, Footer, glow and scrim come from the root layout.
 */
export default function HomePage() {
  return (
    <>
      <SculptureLayer />
      <main id="main">
        <Hero />
        <Services />
        <Work />
        <SocialSyncShowcase />
        <Process />
        <Faq />
        <Contact />
      </main>
    </>
  );
}

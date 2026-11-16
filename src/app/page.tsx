import Contact from '@/components/contact/Contact';
import SceneLayer from '@/components/scene/SceneLayer';
import Faq from '@/components/sections/Faq';
import Hero from '@/components/sections/Hero';
import Process from '@/components/sections/Process';
import Services from '@/components/sections/Services';
import SocialSyncShowcase from '@/components/socialsync/SocialSyncShowcase';
import Work from '@/components/work/Work';

/**
 * The home page. Frozen after the foundation pass: it only fixes the section order.
 * Each area's agent replaces the default export of its own entry file.
 * Nav, Footer, glow and scrim come from the root layout.
 */
export default function HomePage() {
  return (
    <>
      <SceneLayer />
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

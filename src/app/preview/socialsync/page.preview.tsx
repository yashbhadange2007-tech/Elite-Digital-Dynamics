import type { Metadata } from 'next';
import SocialSyncShowcase from '@/components/socialsync/SocialSyncShowcase';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';

/**
 * Preview route for agent D: /preview/socialsync (development only, never built for production).
 * It imports only this area's entry, so another area's compile error cannot break it.
 * `?gap=1` puts 3000px of empty page above the section, to test that the demo loads late.
 */
export const metadata: Metadata = { title: 'Preview: SocialSync demo' };

export default async function SocialSyncShowcasePreview({ searchParams }: { searchParams: Promise<{ gap?: string }> }) {
  const { gap } = await searchParams;
  return (
    <main id="main">
      <VisuallyHidden as="div">
        <h1>Preview: SocialSync demo</h1>
      </VisuallyHidden>
      {gap ? <div data-gap style={{ blockSize: 3000 }} /> : null}
      <SocialSyncShowcase />
    </main>
  );
}

import type { Metadata } from 'next';
import SocialSyncShowcase from '@/components/socialsync/SocialSyncShowcase';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';

/**
 * Preview route for agent D: /preview/socialsync (development only, never built for production).
 * It imports only this area's entry, so another area's compile error cannot break it.
 */
export const metadata: Metadata = { title: 'Preview: SocialSync demo' };

export default function SocialSyncShowcasePreview() {
  return (
    <main id="main">
      <VisuallyHidden as="div">
        <h1>Preview: SocialSync demo</h1>
      </VisuallyHidden>
      <SocialSyncShowcase />
    </main>
  );
}

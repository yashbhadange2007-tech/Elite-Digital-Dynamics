import type { Metadata } from 'next';
import Work from '@/components/work/Work';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';

/**
 * Preview route for agent P: /preview/work (development only, never built for production).
 * It imports only this area's entry, so another area's compile error cannot break it.
 */
export const metadata: Metadata = { title: 'Preview: client sites' };

export default function WorkPreview() {
  return (
    <main id="main">
      <VisuallyHidden as="div">
        <h1>Preview: client sites</h1>
      </VisuallyHidden>
      <Work />
    </main>
  );
}

import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

/**
 * STUB (foundation). Agent G replaces this with the privacy page from SPEC.md.
 * Keep `<main id="main">` (skip link target) and `data-glow="top-right"` (static glow, no 3D).
 */
export const metadata: Metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <main id="main" data-glow="top-right">
      <Container className="py-24">
        <div className="max-w-text">
          <Heading level={1}>Privacy</Heading>
          <p className="mt-6 text-small text-text-muted">Stub: agent G writes the privacy page.</p>
        </div>
      </Container>
    </main>
  );
}

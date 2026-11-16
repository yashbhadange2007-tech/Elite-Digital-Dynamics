import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

/**
 * STUB (foundation). Agent G replaces this with the 404 page from SPEC.md.
 * Keep `<main id="main">` (skip link target) and `data-glow="top-right"` (static glow, no 3D).
 */
export default function NotFound() {
  return (
    <main id="main" data-glow="top-right">
      <Container className="py-24">
        <div className="max-w-text">
          <Heading level={1}>This page is not here.</Heading>
          <p className="ui-lead mt-6">The link may be old or mistyped.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/">Back to home</Button>
            <Button href="/#contact" variant="ghost">
              Start a project
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}

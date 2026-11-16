import type { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

// Next adds noindex here; the title names the page and the home canonical is not inherited.
export const metadata: Metadata = { title: 'Page not found', alternates: { canonical: null } };

export default function NotFound() {
  return (
    <main id="main" data-glow="top-right">
      <Container className="pt-[clamp(2rem,6vw,5rem)] pb-(--section-pad)">
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

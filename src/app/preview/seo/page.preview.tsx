import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { metadata as siteMetadata } from '@/components/seo/metadata';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

/**
 * Preview route for agent G: /preview/seo (development only, never built for production).
 * It imports only this area's entries, so another area's compile error cannot break it.
 */
export const metadata: Metadata = { title: 'Preview: SEO' };

export default function SeoPreview() {
  return (
    <main id="main" data-glow="top-right">
      <Container className="py-24">
        <div className="max-w-text">
          <Heading level={1}>Preview: SEO</Heading>
          <p className="mt-6 text-small text-text-muted">
            Stub: agent G shows the metadata, the structured data and the share image here.
          </p>
          <pre className="mt-6 whitespace-pre-wrap text-small text-text-muted">
            {JSON.stringify(siteMetadata, null, 2)}
          </pre>
          <JsonLd />
        </div>
      </Container>
    </main>
  );
}

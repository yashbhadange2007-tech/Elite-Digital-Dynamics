/* eslint-disable @next/next/no-img-element -- inspection page: every asset at its real pixel size */
import type { Metadata } from 'next';
import { jsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';

/** /preview/seo (development only): the share image, every icon at real size, the JSON-LD. */
export const metadata: Metadata = { title: 'Preview: SEO' };

const ICONS = [
  { src: '/icon.svg', size: 32, label: 'icon.svg (favicon) at 32px' },
  { src: '/icon.svg', size: 16, label: 'icon.svg at 16px' },
  { src: '/apple-icon.png', size: 180, label: 'apple-icon.png 180' },
  { src: '/icons/icon-192.png', size: 192, label: 'icon-192.png' },
  { src: '/icons/icon-512.png', size: 512, label: 'icon-512.png' },
];

export default function SeoPreview() {
  return (
    <main id="main" data-glow="top-right">
      <Container className="space-y-12 py-16">
        <Heading level={1}>Preview: SEO</Heading>
        <section className="space-y-4">
          <Heading level={2}>Share image (1200x630)</Heading>
          <div className="overflow-x-auto">
            <img src="/opengraph-image.png" width={1200} height={630} alt="" className="max-w-none" />
          </div>
        </section>
        <section className="space-y-4">
          <Heading level={2}>Icons</Heading>
          <ul className="flex flex-wrap items-end gap-8">
            {ICONS.map(({ src, size, label }) => (
              <li key={label} className="space-y-2">
                <img src={src} width={size} height={size} alt="" />
                <p className="text-small text-text-muted">{label}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-4">
          <Heading level={2} id="jsonld">
            JSON-LD
          </Heading>
          <pre role="region" aria-labelledby="jsonld" tabIndex={0} className="overflow-x-auto text-small text-text-muted">
            <code>{JSON.stringify(jsonLd, null, 2)}</code>
          </pre>
        </section>
      </Container>
    </main>
  );
}

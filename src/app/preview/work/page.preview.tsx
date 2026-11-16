import type { Metadata } from 'next';
import Work from '@/components/work/Work';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import type { Mode } from '@/components/work/sites.config';

/**
 * Preview route for agent P: /preview/work (development only, never built for production).
 * It imports only this area's entry, so another area's compile error cannot break it.
 *
 * Query (for tests): `url` + `mode` (+ `height` for tall) point the first site's frames at a stub
 * page; `pad=1` puts 150vh of page above and below the section.
 */
export const metadata: Metadata = { title: 'Preview: client sites' };

type Query = { url?: string; mode?: string; height?: string; pad?: string };

export default async function WorkPreview({ searchParams }: { searchParams: Promise<Query> }) {
  const { url, mode, height, pad } = await searchParams;
  const stub =
    url && (mode === 'tall' || mode === 'interactive' || mode === 'screenshot')
      ? { url, mode: mode as Mode, height: Number(height) || undefined }
      : undefined;
  const spacer = pad ? <div aria-hidden="true" className="h-[150vh]" /> : null;

  return (
    <main id="main">
      <VisuallyHidden as="div">
        <h1>Preview: client sites</h1>
      </VisuallyHidden>
      {spacer}
      <Work stub={stub} />
      {spacer}
    </main>
  );
}

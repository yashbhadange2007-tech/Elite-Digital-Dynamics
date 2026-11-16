import type { Metadata } from 'next';
import Contact from '@/components/contact/Contact';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';

/**
 * Preview route for agent E: /preview/contact (development only, never built for production).
 * It imports only this area's entry, so another area's compile error cannot break it.
 *
 * Query (for tests): `key=none` (default, WhatsApp / email mode) or `key=demo` (a dummy key, so
 * key mode runs against mocked Web3Forms responses); `timeout=<ms>` shortens the 12 s timeout.
 */
export const metadata: Metadata = { title: 'Preview: enquiry form and contact' };

type Query = { key?: string; timeout?: string };

export default async function ContactPreview({ searchParams }: { searchParams: Promise<Query> }) {
  const { key, timeout } = await searchParams;
  return (
    <main id="main">
      <VisuallyHidden as="div">
        <h1>Preview: enquiry form and contact</h1>
      </VisuallyHidden>
      <Contact accessKey={key === 'demo' ? 'demo-key-for-tests' : ''} timeoutMs={Number(timeout) || undefined} />
    </main>
  );
}

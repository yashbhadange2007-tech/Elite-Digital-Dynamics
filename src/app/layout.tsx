import type { ReactNode } from 'react';
import Footer from '@/components/sections/Footer';
import Nav from '@/components/sections/Nav';
import JsonLd from '@/components/seo/JsonLd';
import { AppInit } from '@/components/ui/AppInit';
import { SkipLinks } from '@/components/ui/SkipLinks';
import { manrope } from '@/lib/fonts';
import { MOTION_BOOT_SCRIPT } from '@/lib/quality-store';
import './globals.css';

// Owned by the SEO agent (src/components/seo/metadata.ts).
export { metadata, viewport } from '@/components/seo/metadata';

/**
 * Root layout. Frozen after the foundation pass.
 *
 * - data-glass / data-motion are the server defaults; the quality store rewrites them in the
 *   browser, and the inline script sets data-motion before first paint. That is why <html> has
 *   suppressHydrationWarning.
 * - data-scroll-behavior="smooth" tells Next to jump (not glide) to the top on route changes
 *   while the CSS keeps smooth scrolling for in-page anchors.
 * - Layer order, back to front: glow (0), scene canvas (1, mounted by page.tsx), scrim (2),
 *   content (10), nav (50), skip links (100).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-IN"
      data-glass="lite"
      data-motion="full"
      data-scroll-behavior="smooth"
      className={manrope.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT_SCRIPT }} />
      </head>
      <body>
        <SkipLinks />
        <div className="page-glow-clip" aria-hidden="true">
          <div className="page-glow" />
        </div>
        <div className="page-scrim" aria-hidden="true" />
        <Nav />
        {children}
        <Footer />
        <JsonLd />
        <AppInit />
      </body>
    </html>
  );
}

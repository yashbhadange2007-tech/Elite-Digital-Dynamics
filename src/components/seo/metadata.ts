import type { Metadata, Viewport } from 'next';
import { site } from '@/lib/site';

/**
 * Site-wide metadata (SPEC.md "Metadata"), re-exported by the root layout.
 * Icons, the share image and the manifest link come from the file conventions in src/app
 * (icon.svg, apple-icon.png, opengraph-image.png + .alt.txt, manifest.ts), so they are not listed here.
 * Pages set their own `title` (filled into the template) and their own canonical path.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: {
    default: 'Elite Digital Dynamics | Websites, Apps & Automation in Pune',
    template: '%s | Elite Digital Dynamics',
  },
  description:
    'Pune digital agency building websites, custom apps, Google review collection, AI video and WhatsApp automation for businesses.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: site.name,
    title: 'Elite Digital Dynamics',
    description: 'Websites, apps and automation for businesses. Your Vision, Our Innovation.',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#05070D', // --color-bg
};

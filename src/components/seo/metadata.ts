import type { Metadata, Viewport } from 'next';
import { site } from '@/lib/site';

/**
 * STUB (foundation). Agent G owns this file and replaces it with the full metadata from SPEC.md
 * (Open Graph, share image, icons, canonical). The root layout re-exports both names.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: {
    default: 'Elite Digital Dynamics | Websites, Apps & Automation in Pune',
    template: '%s | Elite Digital Dynamics',
  },
  description:
    'Pune digital agency building websites, custom apps, Google review collection, AI video and WhatsApp automation for local businesses.',
  // Until src/app/icon.svg exists, so browsers do not ask for a missing /favicon.ico.
  icons: { icon: '/brand/edd-favicon.svg' },
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#080505',
};

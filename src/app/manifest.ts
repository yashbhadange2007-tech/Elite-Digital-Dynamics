import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: 'Elite Digital',
    description:
      'Pune digital agency building websites, custom apps, Google review collection, AI video and WhatsApp automation for businesses.',
    start_url: '/',
    display: 'standalone',
    background_color: '#05070D', // --color-bg
    theme_color: '#05070D',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}

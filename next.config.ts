import type { NextConfig } from 'next';
import sites from './src/components/work/sites.data.json';

/**
 * Preview routes (`src/app/preview/<area>/page.preview.tsx`) exist for development and review only.
 * They are compiled only outside production, or when PREVIEW_ROUTES=1 is set on purpose.
 */
const previewRoutes = process.env.NODE_ENV !== 'production' || process.env.PREVIEW_ROUTES === '1';

/**
 * `/visit/<slug>` -> the client's live site. Entries come from the portfolio agent's JSON, so page
 * text and the browser status bar never show a client's hosting domain. Fail the build on a bad entry.
 */
const visitRedirects = (sites as { slug: string; url: string }[]).map(({ slug, url }) => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || !/^https:\/\/[^\s/]+/.test(url)) {
    throw new Error(`sites.data.json: invalid entry ${JSON.stringify({ slug, url })}`);
  }
  return { source: `/visit/${slug}`, destination: url, permanent: false };
});

/**
 * Security headers, production only (the dev server needs eval and a websocket; Phase 4 tests run
 * against `next start`).
 *
 * ponytail: static policy with 'unsafe-inline' scripts, because a per-request nonce makes every
 * page dynamically rendered (slower first load on phones). Acceptable because the site renders no
 * visitor input and loads no third-party script. Move to a nonce in proxy.ts if either changes.
 */
const production = process.env.NODE_ENV === 'production';
// Only sites that are actually framed (a site in screenshot mode in both frames needs no frame-src).
const framedOrigins = (sites as { url: string; mode?: Record<string, string> }[])
  .filter((s) => !s.mode || Object.values(s.mode).some((m) => m !== 'screenshot'))
  .map((s) => new URL(s.url).origin);
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://api.web3forms.com",
  `frame-src ${framedOrigins.join(' ') || "'none'"}`,
  "worker-src 'self' blob:",
  "media-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');
const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()',
  },
];

const nextConfig: NextConfig = {
  pageExtensions: previewRoutes ? ['tsx', 'ts', 'preview.tsx'] : ['tsx', 'ts'],

  // `next dev` would otherwise write an AGENTS.md into the repository root on its own.
  agentRules: false,

  // No floating dev badge: it lands in evidence screenshots and can take taps in phone-size
  // tests. Compile and runtime errors are still shown.
  devIndicators: false,

  async redirects() {
    return visitRedirects;
  },

  async headers() {
    return production ? [{ source: '/(.*)', headers: securityHeaders }] : [];
  },
};

export default nextConfig;

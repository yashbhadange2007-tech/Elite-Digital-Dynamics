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

const nextConfig: NextConfig = {
  pageExtensions: previewRoutes ? ['tsx', 'ts', 'preview.tsx'] : ['tsx', 'ts'],

  async redirects() {
    return visitRedirects;
  },

  // SECURITY HEADERS PLACEHOLDER (security pass edits this file only):
  // add `async headers() { ... }` here with the static CSP and the other headers
  // listed in docs/ARCHITECTURE.md section 7. Intentionally empty for now.
};

export default nextConfig;

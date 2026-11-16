import AxeBuilder from '@axe-core/playwright';
import type { Response } from '@playwright/test';
import { SERVICES } from '../src/lib/services';
import { site } from '../src/lib/site';
import { expect, expectNoHorizontalOverflow, test } from './fixtures';

/** Privacy page, 404, head tags, sitemap / robots / manifest and JSON-LD (agent G: G1, G2, G3, G6, G7, G9). */

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// SPEC.md "Privacy page", copied word for word: h1, intro, then each heading and its paragraph, then the footer line.
const PRIVACY = [
  'Privacy',
  'This page says, in plain words, what this website does with your information.',
  'What the enquiry form collects.',
  'Your name and phone number, and, if you choose to give them, your email, business name, the service you are interested in and your message.',
  'How it reaches us.',
  'In one of two ways. (1) The form opens WhatsApp or your own email app with your details filled in; nothing leaves your device until you press send there. (2) Where the form sends directly, it uses Web3Forms, a form delivery service, which forwards your message to our email inbox.',
  'What we use it for.',
  'Only to reply to your enquiry and to talk about your project. We do not sell it or pass it to advertisers.',
  'Links to client websites.',
  'The "Our work" section shows still pictures of client websites. Nothing from those websites loads on this page. If you open one, it opens in a new tab under that website\'s own privacy terms.',
  'Cookies and tracking.',
  'This website sets no cookies and runs no analytics or advertising trackers. It stores one setting in your browser, whether you paused the background motion, and that setting never leaves your device.',
  'Hosting.',
  'The site is hosted on Vercel. Like any web host, it processes technical data such as your IP address to deliver the pages.',
  'Your choices.',
  'To see, correct or delete the details you sent us, email elitedigitaldynamics.26@gmail.com or call +91 92260 46693.',
  'Contact.',
  'Elite Digital Dynamics, 102-B Devratna Apartment, Shirole Gali, Shivaji Nagar, Pune.',
  'Last updated: November 2026.',
];

test('G1 /privacy: SPEC text, one h1, headings in order, nav and footer, no 3D', async ({ page }, testInfo) => {
  const scripts: Response[] = [];
  page.on('response', (r) => {
    if (r.request().resourceType() === 'script') scripts.push(r);
  });
  await page.goto('/privacy');

  const main = page.locator('main');
  expect(await main.locator('h1, h2, p').allTextContents()).toEqual(PRIVACY);
  await expect(page.locator('h1')).toHaveCount(1);
  expect(await main.evaluate((m) => [...m.querySelectorAll('h1, h2, h3, h4')].map((h) => h.tagName))).toEqual([
    'H1',
    ...Array(8).fill('H2'),
  ]);
  await expect(page.locator('body > header nav').first()).toBeAttached();
  await expect(page.locator('body > footer')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page).toHaveTitle('Privacy | Elite Digital Dynamics');

  await page.waitForLoadState('networkidle');
  // Read bodies one at a time after load (reading them eagerly in the handler can come back empty).
  const withThree: string[] = [];
  for (const r of scripts) if ((await r.text()).includes('WebGLRenderer')) withThree.push(r.url());
  expect(scripts.length, 'scripts seen').toBeGreaterThan(0);
  expect(withThree, 'three.js chunk requested').toEqual([]);

  await expectNoHorizontalOverflow(page);
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  await page.screenshot({ path: testInfo.snapshotPath('privacy.png'), fullPage: true });
});

test.describe('G2 404', () => {
  // Chromium logs the 404 document itself as a failed resource.
  test.use({ allowedConsoleErrors: [/status of 404/] });

  test('unknown URL: status 404, SPEC copy, both buttons', async ({ page }, testInfo) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response!.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('This page is not here.');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main p')).toHaveText('The link may be old or mistyped.');
    await expect(page.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
    await expect(page.locator('main').getByRole('link', { name: 'Start a project' })).toHaveAttribute('href', '/#contact');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

    await expectNoHorizontalOverflow(page);
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    await page.screenshot({ path: testInfo.snapshotPath('404.png'), fullPage: true });
  });
});

test('G3 head of / carries the SPEC metadata; /privacy uses the title template', async ({ page, request }) => {
  await page.goto('/');
  const attr = (selector: string, name = 'content') => page.locator(`head ${selector}`).first().getAttribute(name);

  await expect(page).toHaveTitle('Elite Digital Dynamics | Websites, Apps & Automation in Pune');
  expect(await attr('meta[name="description"]')).toBe(
    'Pune digital agency building websites, custom apps, Google review collection, AI video and WhatsApp automation for local businesses.',
  );
  expect(new URL((await attr('link[rel="canonical"]', 'href'))!).pathname).toBe('/');
  expect(await attr('meta[property="og:title"]')).toBe('Elite Digital Dynamics');
  expect(await attr('meta[property="og:description"]')).toBe(
    'Websites, apps and automation for local businesses. Your Vision, Our Innovation.',
  );
  const ogImage = new URL((await attr('meta[property="og:image"]'))!); // throws unless absolute
  expect(ogImage.protocol).toMatch(/^https?:$/);
  expect(ogImage.pathname).toBe('/opengraph-image.png');
  expect(await attr('meta[property="og:image:alt"]')).toBe(
    'Elite Digital Dynamics: two red rings around a glowing core. Your Vision, Our Innovation.',
  );
  expect((await request.get(ogImage.pathname)).headers()['content-type']).toBe('image/png');
  expect(await attr('meta[name="twitter:card"]')).toBe('summary_large_image');
  expect(await attr('meta[name="twitter:image"]')).toBe(ogImage.href);
  expect(await attr('meta[name="theme-color"]')).toBe('#080505');
  expect(await attr('link[rel="icon"][type="image/svg+xml"]', 'href')).toMatch(/^\/icon\.svg/);
  expect(await attr('link[rel="apple-touch-icon"]', 'sizes')).toBe('180x180');
  expect(await attr('link[rel="manifest"]', 'href')).toBe('/manifest.webmanifest');

  const privacy = await (await request.get('/privacy')).text();
  expect(privacy).toContain('<title>Privacy | Elite Digital Dynamics</title>');
});

test('G6 sitemap, robots and manifest', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]));
  expect(locs.map((u) => u.pathname)).toEqual(['/', '/privacy']);
  expect(locs.every((u) => /^https?:$/.test(u.protocol))).toBe(true);

  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toMatch(/^User-Agent: \*$/m);
  expect(robots).toMatch(/^Allow: \/$/m);
  expect(robots).not.toMatch(/^Disallow: \/\s*$/m);
  expect(new URL(/^Sitemap: (\S+)$/m.exec(robots)![1]).pathname).toBe('/sitemap.xml');

  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest).toMatchObject({
    name: 'Elite Digital Dynamics',
    short_name: expect.any(String),
    start_url: '/',
    display: 'standalone',
    background_color: '#080505',
    theme_color: '#080505',
  });
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(['192x192', '512x512']);
  for (const icon of manifest.icons) expect((await request.get(icon.src)).status()).toBe(200);
});

test('G7 one ProfessionalService JSON-LD built from site.ts, nothing invented', async ({ page }) => {
  await page.goto('/');
  const scripts = page.locator('script[type="application/ld+json"]');
  await expect(scripts).toHaveCount(1);
  const raw = (await scripts.textContent())!;
  const data = JSON.parse(raw);

  expect(data['@type']).toBe('ProfessionalService');
  expect(data.name).toBe(site.name);
  expect(data.telephone).toEqual(site.phones.map((p) => p.display));
  expect(data.email).toBe(site.email);
  expect(data.address).toEqual({
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    addressLocality: 'Pune',
    addressRegion: 'Maharashtra',
    addressCountry: 'IN',
  });
  expect(data.areaServed.name).toBe('Pune');
  expect(data.makesOffer.map((o: { itemOffered: { name: string } }) => o.itemOffered.name)).toEqual(
    SERVICES.map((s) => s.name),
  );
  for (const key of ['aggregateRating', 'review', 'priceRange', 'openingHours', 'openingHoursSpecification', 'geo', 'foundingDate', 'sameAs']) {
    expect(raw, key).not.toContain(`"${key}"`);
  }
});

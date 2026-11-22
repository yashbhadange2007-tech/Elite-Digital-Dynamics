import { statSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import sites from '../src/components/work/sites.data.json';
import { expect, expectNoHorizontalOverflow, expectNoVercelText, test } from './fixtures';

/**
 * "Our work": one link card per project on the home page. Client sites open in a new tab through
 * `/visit/<slug>`; SocialSync goes to the demo on the page. Nothing from a client site loads here.
 */

test.describe.configure({ retries: 1 }); // the dev server is shared: a hot reload can hit a test

const CLIENT = /^https:\/\/(www\.)?(hotelorientelite\.co\.in|goodlife-fitness-website\.vercel\.app|goodlife-fitness-club\.vercel\.app)\//;

async function openWork(page: Page) {
  await page.goto('/');
  await page.locator('#work').evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
}

const card = (page: Page, slug: string) => page.locator(`[data-work-card="${slug}"]`);

test('client cards: one link each, through /visit, in a new tab', async ({ page }) => {
  await openWork(page);
  await expect(page.locator('[data-work-card]')).toHaveCount(sites.length + 1);
  for (const site of sites) {
    const link = card(page, site.slug);
    await expect(link).toHaveAttribute('href', `/visit/${site.slug}`);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toContainText(site.name);
    await expect(link).toContainText('Visit site');
    await expect(link).toContainText(site.city);
    // The accessible name says it opens a new tab.
    await expect(link).toHaveAccessibleName(/opens in new tab/);
  }
});

test('/visit routes redirect to the right client site', async ({ request }) => {
  for (const site of sites) {
    const response = await request.get(`/visit/${site.slug}`, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers()['location']?.replace(/\/$/, '')).toBe(site.url);
  }
});

test('clicking a client card opens the site in a new tab and keeps our page', async ({ page, context }) => {
  await context.route(CLIENT, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>client</title>client' }));
  await openWork(page);
  const site = sites[1];
  const [popup] = await Promise.all([context.waitForEvent('page'), card(page, site.slug).click()]);
  await popup.waitForLoadState();
  expect(popup.url()).toBe(`${site.url}/`);
  expect(page.url()).toContain('/');
  await popup.close();
});

test('SocialSync card goes to the demo on this page', async ({ page }) => {
  await openWork(page);
  const link = card(page, 'socialsync');
  await expect(link).toHaveAttribute('href', '#demo');
  await expect(link).not.toHaveAttribute('target', /.+/);
  await link.click();
  await expect(page).toHaveURL(/#demo$/);
  await expect(page.locator('#demo h2')).toBeInViewport();
});

test('no iframe anywhere, previews are small and lazy', async ({ page }) => {
  await page.goto('/');
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(100);
  }
  await expect(page.locator('iframe')).toHaveCount(0);

  const images = page.locator('[data-work-card] img');
  await expect(images).toHaveCount(sites.length + 1);
  for (const img of await images.all()) await expect(img).toHaveAttribute('loading', 'lazy');
  for (const slug of [...sites.map((s) => s.slug), 'socialsync']) {
    expect(statSync(`public/work/${slug}.webp`).size, slug).toBeLessThan(150 * 1024);
  }
});

test('keyboard focus is visible on a card', async ({ page }) => {
  await openWork(page);
  const first = card(page, sites[0].slug);
  await first.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();
  const outline = await first.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
});

test('layout: no overflow, no hosting domain, accessible', async ({ page }, testInfo) => {
  await openWork(page);
  await page.waitForTimeout(500);
  await expectNoHorizontalOverflow(page);
  await expectNoVercelText(page);
  const results = await new AxeBuilder({ page }).include('#work').analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

  // Phones: one card per row.
  if ((page.viewportSize()?.width ?? 0) < 768) {
    const boxes = await page.locator('[data-work-card]').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().left));
    expect(new Set(boxes.map(Math.round)).size).toBe(1);
  }
  await page.locator('#work').screenshot({ path: testInfo.snapshotPath('work.png') });
});

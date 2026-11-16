import { expect, expectNoHorizontalOverflow, expectNoVercelText, test } from './fixtures';

/**
 * Whole-site checks against the production server (security headers exist only there):
 *   pnpm build && pnpm start -p 3200
 *   BASE_URL=http://localhost:3200 pnpm exec playwright test tests/site.spec.ts
 */
test.skip(!process.env.BASE_URL, 'run against a production server (set BASE_URL)');

const PAGES = ['/', '/privacy'];

for (const path of PAGES) {
  test(`${path}: security headers, no blocked content, no ".vercel.app" text`, async ({ page }) => {
    const violations: string[] = [];
    await page.exposeFunction('reportCsp', (v: string) => violations.push(v));
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) =>
        (window as unknown as { reportCsp: (v: string) => void }).reportCsp(`${e.violatedDirective} ${e.blockedURI}`),
      );
    });

    const response = await page.goto(path, { waitUntil: 'load' });
    const headers = response!.headers();
    const csp = headers['content-security-policy'] ?? '';
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain('connect-src');
    expect(csp).toContain('https://api.web3forms.com');
    expect(csp).toContain('frame-src');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['strict-transport-security']).toBeTruthy();

    // Walk the page so lazy sections (client frames, demo) mount under the policy.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 600) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(1500);

    expect(violations, 'content-security-policy violations').toEqual([]);
    await expectNoVercelText(page);
    await expectNoHorizontalOverflow(page);
  });
}

test.describe('404', () => {
  test.use({ allowedConsoleErrors: [/404/] }); // the browser logs the 404 document itself
  test('unknown URL: real 404 with headers', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response!.status()).toBe(404);
    expect(response!.headers()['content-security-policy']).toBeTruthy();
  });
});

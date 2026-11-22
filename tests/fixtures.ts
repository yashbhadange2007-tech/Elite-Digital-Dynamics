import { test as base, expect, type Page } from '@playwright/test';

/**
 * Shared test guard. Import `test` and `expect` from here, not from '@playwright/test'.
 * Every test then fails if OUR page logs a console error, throws, requests a missing or
 * failing same-origin file, or talks to an origin that is not on the allow list.
 *
 * Framed client sites load their own third-party files; those belong to them and are ignored.
 */

// The only origin our own page may reach: the form API (always mocked in tests).
const ALLOWED_HOSTS = ['api.web3forms.com'];

type Options = {
  /** Extra origins a spec may reach, e.g. made-up hosts it fulfils with page.route(). */
  extraAllowedOrigins: string[];
  /** Console errors a spec expects, e.g. [/404/] when it loads a missing page on purpose. */
  allowedConsoleErrors: RegExp[];
  /** Default true: the page loads as a returning visitor, without the intro. */
  skipIntro: boolean;
};

export const test = base.extend<Options & { guard: void }>({
  extraAllowedOrigins: [[], { option: true }],
  allowedConsoleErrors: [[], { option: true }],
  skipIntro: [true, { option: true }],

  guard: [
    async ({ page, baseURL, extraAllowedOrigins, allowedConsoleErrors, skipIntro }, use) => {
      const own = new URL(baseURL ?? 'http://localhost:3000').origin;
      const allowed = new Set([...ALLOWED_HOSTS, ...extraAllowedOrigins.map((o) => new URL(o).host)]);
      const problems: string[] = [];
      const isOwn = (url: string) => url.startsWith(own + '/') || url === own;
      const isHttp = (url: string) => /^https?:/.test(url);

      // The intro plays once per browser session. Tests start as a returning visitor, so it never
      // covers a screenshot; the intro spec clears this flag to see it.
      if (skipIntro) {
        await page.addInitScript(() => {
          try {
            sessionStorage.setItem('edd-intro', '1');
          } catch {
            /* storage blocked */
          }
        });
      }

      page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));

      page.on('console', (message) => {
        if (message.type() !== 'error') return;
        const from = message.location().url;
        if (from && isHttp(from) && !isOwn(from)) return; // logged by a framed client site
        const text = message.text();
        if (allowedConsoleErrors.some((pattern) => pattern.test(text))) return;
        problems.push(`console error: ${text}`);
      });

      page.on('request', (request) => {
        const url = request.url();
        if (!isHttp(url) || isOwn(url)) return;
        let fromOurPage = true;
        try {
          // A framed site's own sub-requests are not ours; the frame's document request is.
          fromOurPage = request.frame() === page.mainFrame() || request.isNavigationRequest();
        } catch {
          /* service worker or detached frame: treat as ours */
        }
        if (fromOurPage && !allowed.has(new URL(url).host)) problems.push(`off-site request: ${url}`);
      });

      page.on('requestfailed', (request) => {
        const reason = request.failure()?.errorText ?? '';
        if (isOwn(request.url()) && !reason.includes('ERR_ABORTED')) problems.push(`request failed: ${request.url()} (${reason})`);
      });

      page.on('response', (response) => {
        const request = response.request();
        const isPageItself = request.isNavigationRequest() && request.frame() === page.mainFrame();
        if (isOwn(response.url()) && response.status() >= 400 && !isPageItself) {
          problems.push(`HTTP ${response.status()}: ${response.url()}`);
        }
      });

      await use();
      expect(problems, 'the page must stay clean (console, errors, requests)').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** The page must never scroll sideways. */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);
}

/** The owner's rule: ".vercel.app" is never visible or read out anywhere on our page (link targets are fine). */
export async function expectNoVercelText(page: Page) {
  const hits = await page.evaluate(() => {
    const found: string[] = [];
    if (/\.vercel\.app/i.test(document.body.innerText)) found.push('visible text');
    for (const el of document.querySelectorAll('[aria-label],[title],[alt],[placeholder]')) {
      for (const name of ['aria-label', 'title', 'alt', 'placeholder']) {
        const value = el.getAttribute(name);
        if (value && /\.vercel\.app/i.test(value)) found.push(`${name}="${value}"`);
      }
    }
    return found;
  });
  expect(hits, '".vercel.app" must not be visible or announced').toEqual([]);
}

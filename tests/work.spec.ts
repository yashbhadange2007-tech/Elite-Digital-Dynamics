import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page, Route } from '@playwright/test';
import sites from '../src/components/work/sites.data.json';
import { expect, expectNoHorizontalOverflow, expectNoVercelText, test } from './fixtures';

/**
 * "Our work" (agent P): the three client-site previews, on /preview/work.
 * The real client hosts are answered here with a small page, so the run needs no network and the
 * mode logic is what is tested. Awkward and hostile pages come from made-up hosts.
 */

test.describe.configure({ retries: 1 }); // the dev server is shared: a hot reload can hit a test

const STUB = {
  tall: 'https://stub-tall.test/',
  deny: 'https://stub-deny.test/',
  topnav: 'https://stub-topnav.test/',
  abort: 'https://stub-abort.test/',
  slow: 'https://stub-slow.test/',
};
test.use({ extraAllowedOrigins: Object.values(STUB) });

const CLIENT = /^https:\/\/(www\.)?(hotelorientelite\.co\.in|goodlife-fitness-website\.vercel\.app|goodlife-fitness-club\.vercel\.app)\//;
const TALL_HEIGHT = 6000;
const html = (body: string, headers: Record<string, string> = {}) => (route: Route) =>
  route.fulfill({ status: 200, headers: { 'content-type': 'text/html', ...headers }, body });

test.beforeEach(async ({ context }) => {
  // Popups (the opened live site) share the context, so they are answered here too.
  await context.route(CLIENT, html('<title>client</title><body style="margin:0;background:#223"><div style="height:4000px">client</div>'));
  // Fixed-height sections: a page whose height does not follow the iframe height, as tall mode needs.
  await context.route(`${STUB.tall}**`, html(`<title>tall</title><style>body{margin:0}section{height:${TALL_HEIGHT / 10}px}section:nth-child(odd){background:#345}</style>${'<section>tall</section>'.repeat(10)}`));
  await context.route(`${STUB.deny}**`, html('<title>deny</title>refuses framing', { 'x-frame-options': 'DENY' }));
  await context.route(`${STUB.topnav}**`, html('<title>topnav</title><script>try{top.location="https://stub-topnav.test/hijacked"}catch(e){}</script>hostile'));
  await context.route(`${STUB.abort}**`, (route) => route.abort());
  await context.route(`${STUB.slow}**`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 12_000));
    await route.fulfill({ status: 200, contentType: 'text/html', body: 'late' }).catch(() => {});
  });
});

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;
const open = (page: Page, query = '') => page.goto(`/preview/work${query}`);
const stub = (url: string, mode: string) => `?url=${encodeURIComponent(url)}&mode=${mode}&height=${TALL_HEIGHT}`;
/** The first site's preview box: the phone frame below 1024px, the laptop frame from 1024px. */
const firstFrame = (page: Page) => page.locator('#work li').first().locator('div[data-variant]:visible');
const firstScroller = (page: Page) => firstFrame(page).getByRole('region');

async function scrollIntoView(locator: Locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
}

async function swipe(page: Page, x: number, fromY: number, toY: number) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: fromY }] });
  for (let i = 1; i <= 8; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: fromY + ((toY - fromY) * i) / 8 }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(500);
}

/** P2: drag or wheel over a preview scrolls it; at either end the page itself scrolls on. */
test('scrolling passes from the preview to the page at both ends', async ({ page }) => {
  await open(page, `${stub(STUB.tall, 'tall')}&pad=1`);
  const scroller = firstScroller(page);
  await scrollIntoView(scroller);
  const box = (await scroller.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const top = () => scroller.evaluate((el) => el.scrollTop);
  const pageY = () => page.evaluate(() => window.scrollY);
  const touch = test.info().project.name === 'phone';
  const gesture = async (down: boolean) => {
    if (touch) await swipe(page, x, down ? y + 120 : y - 120, down ? y - 120 : y + 120);
    else {
      await page.mouse.move(x, y);
      await page.mouse.wheel(0, down ? 300 : -300);
      await page.waitForTimeout(500);
    }
  };

  const startY = await pageY();
  await gesture(true);
  expect(await top(), 'the preview scrolled').toBeGreaterThan(0);
  expect(await pageY(), 'the page stayed while the preview scrolled').toBe(startY);

  await scroller.evaluate((el) => (el.scrollTop = el.scrollHeight));
  const atBottomY = await pageY();
  await gesture(true);
  await gesture(true);
  expect(await pageY(), 'the page scrolled on past the bottom of the preview').toBeGreaterThan(atBottomY);

  await scrollIntoView(scroller);
  await scroller.evaluate((el) => (el.scrollTop = 0));
  const atTopY = await pageY();
  await gesture(false);
  await gesture(false);
  expect(await pageY(), 'the page scrolled on past the top of the preview').toBeLessThan(atTopY);
});

/** P3: a tap or click on the preview and the "Open live site" button open /visit/<slug>, a 307 to the site. */
test('preview and button open the live site through /visit', async ({ page, request }) => {
  await open(page);
  const hotel = sites[0];
  const target = firstScroller(page).getByRole('link', { includeHidden: true });
  await scrollIntoView(firstScroller(page));
  const opened = async (action: () => Promise<void>) => {
    const [popup, visit] = await Promise.all([
      page.waitForEvent('popup'),
      page.context().waitForEvent('request', (r) => r.url().includes('/visit/')),
      action(),
    ]);
    await popup.close();
    return new URL(visit.url()).pathname;
  };

  const corner = { position: { x: 40, y: 40 } };
  const tap = test.info().project.name === 'phone' ? () => target.tap(corner) : () => target.click(corner);
  expect(await opened(tap)).toBe(`/visit/${hotel.slug}`);
  const button = page.locator('#work li').first().getByRole('link', { name: /Open live site/ });
  expect(await opened(() => button.click())).toBe(`/visit/${hotel.slug}`);

  for (const site of sites) {
    const response = await request.get(`/visit/${site.slug}`, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toBe(new URL(site.url).href);
  }
});

/** P4: ".vercel.app" nowhere a visitor sees or hears; the address bars show business names. */
test('no hosting domain in text, labels or address bars', async ({ page }) => {
  await open(page);
  await scrollIntoView(page.locator('#work ul'));
  await page.waitForTimeout(1500);
  await expectNoVercelText(page);
  const labels = await page.locator('#work div[data-variant]:visible > div > div[aria-hidden="true"] > span').allInnerTexts();
  const names = sites.map((site) => site.name);
  expect(labels.length).toBeGreaterThan(0);
  for (const label of labels) expect(names).toContain(label);
});

/** P5: nothing loads from a client host until the frames are near; one iframe on phones. */
test('iframes mount only near the viewport, one at a time on phones', async ({ page }) => {
  const framedRequests: string[] = [];
  page.on('request', (r) => (CLIENT.test(r.url()) || r.url().startsWith(STUB.tall)) && framedRequests.push(r.url()));
  // The first site points at a stub in interactive mode, so every project has an iframe to watch.
  await open(page, `${stub(STUB.tall, 'interactive')}&pad=1`);
  await page.waitForTimeout(2000);
  expect(framedRequests, 'no request to a framed host while the section is far below').toEqual([]);
  expect(await page.locator('iframe').count()).toBe(0);

  const frame = firstFrame(page);
  const placeBelowFold = (gap: number) =>
    frame.evaluate((el, gap) => window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - innerHeight - gap, behavior: 'instant' }), gap);
  await placeBelowFold(900);
  await page.waitForTimeout(800);
  expect(await frame.locator('iframe').count(), '900px below the fold: not yet').toBe(0);
  await placeBelowFold(400);
  await expect(frame.locator('iframe'), '400px below the fold: mounted').toHaveCount(1);

  if (isDesktop(page)) {
    await scrollIntoView(page.locator('#work ul'));
    await expect(page.locator('iframe')).toHaveCount(3);
    return;
  }
  await scrollIntoView(page.locator('#work fieldset'));
  const choose = async (name: string, src: string) => {
    await page.locator('#work fieldset').getByText(name, { exact: true }).click();
    await expect(page.locator('iframe')).toHaveCount(1);
    await expect(page.locator('iframe')).toHaveAttribute('src', new RegExp(`^${src}`));
  };
  await choose(sites[1].name, sites[1].url);
  await choose(sites[2].name, sites[2].url);
  await choose(sites[0].name, STUB.tall);
});

/** P6: never an error page or an empty box. */
test('blocked host, refused framing and slow loads show the screenshot', async ({ page }) => {
  const tiles = (isDesktop(page) ? sites[0].shots.laptop : sites[0].shots.phone).length;
  const frame = firstFrame(page);
  const loadedTiles = () =>
    frame.locator('img').evaluateAll((imgs) => imgs.filter((img) => (img as HTMLImageElement).naturalWidth > 0).length);

  // Host unreachable: the iframe is dropped for the full screenshot right away.
  await open(page, stub(STUB.abort, 'interactive'));
  await scrollIntoView(frame);
  await expect(frame.locator('iframe'), 'well before the 8 s timer').toHaveCount(0, { timeout: 3000 });
  await expect(frame.locator('img')).toHaveCount(tiles);
  await expect.poll(loadedTiles).toBeGreaterThan(0);

  // Refuses framing: screenshot mode, tiles in our scroller, no iframe at all.
  await open(page, stub(STUB.deny, 'screenshot'));
  await scrollIntoView(frame);
  await expect(frame.locator('img')).toHaveCount(tiles);
  await expect.poll(loadedTiles).toBeGreaterThan(0);
  expect(await frame.locator('iframe').count()).toBe(0);

  // Slow: the first tile shows under the waiting iframe, then the screenshot takes over at 8 s.
  // A pending iframe holds back the window load event, so do not wait for it here.
  await page.goto(`/preview/work${stub(STUB.slow, 'interactive')}`, { waitUntil: 'domcontentloaded' });
  await scrollIntoView(frame);
  await expect(frame.locator('iframe')).toHaveCount(1);
  await expect(frame.locator('img')).toHaveCount(1);
  await expect.poll(loadedTiles).toBe(1);
  await page.waitForTimeout(4000);
  await expect(frame.locator('iframe'), 'still waiting at about 5 s').toHaveCount(1);
  await expect(frame.locator('iframe')).toHaveCount(0, { timeout: 6000 });
  await expect(frame.locator('img')).toHaveCount(tiles);
  await expect(firstScroller(page)).toBeVisible();
});

/** P7: the sandbox is exact, and a framed page cannot navigate ours. */
test('sandboxed frames cannot navigate the page', async ({ page }) => {
  await open(page, stub(STUB.topnav, 'interactive'));
  const before = page.url();
  await scrollIntoView(page.locator('#work ul'));
  await expect(firstFrame(page).locator('iframe')).toHaveCount(1);
  await page.waitForTimeout(2000);
  expect(page.url()).toBe(before);
  const sandboxes = await page.locator('iframe').evaluateAll((frames) => frames.map((f) => f.getAttribute('sandbox')));
  expect(sandboxes.length).toBeGreaterThan(0);
  for (const value of sandboxes) expect(value).toBe('allow-scripts allow-same-origin');
});

/** P8: Tab reaches the selector, the scroller (arrow keys scroll it) and the button; never a tall iframe. */
test('keyboard reaches selector, scroller and button', async ({ page }) => {
  await open(page, stub(STUB.tall, 'tall'));
  await expect(firstFrame(page).locator('iframe')).toHaveCount(1);
  await page.locator('#work-title').click();
  const focused = () =>
    page.evaluate(() => {
      const el = document.activeElement!;
      return { tag: el.tagName, role: el.getAttribute('role'), name: el.getAttribute('name'), text: el.textContent?.trim() };
    });

  if (!isDesktop(page)) {
    await page.keyboard.press('Tab');
    expect(await focused()).toMatchObject({ tag: 'INPUT', name: 'work-site' });
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('input[name="work-site"]:checked')).toHaveValue(sites[1].slug);
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('input[name="work-site"]:checked')).toHaveValue(sites[0].slug);
  }
  await page.keyboard.press('Tab');
  expect(await focused()).toMatchObject({ role: 'region' });
  const scroller = firstScroller(page);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('PageDown');
  await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Tab');
  expect((await focused()).text).toContain('Open live site');
  expect(await page.locator('iframe[inert]').evaluateAll((frames) => frames.some((f) => f.contains(document.activeElement)))).toBe(false);
});

/** P9 and P10: preview size, layout per width, no sideways scroll, axe. */
test('layout, preview size and accessibility', async ({ page }, testInfo) => {
  await open(page);
  await scrollIntoView(page.locator('#work ul'));
  await page.waitForTimeout(1500);
  const vh = page.viewportSize()!.height;
  const scrollers = page.locator('#work div[data-variant]:visible [role="region"], #work div[data-variant]:visible iframe');
  for (const box of await scrollers.evaluateAll((els) => els.map((el) => el.parentElement!.getBoundingClientRect().height))) {
    expect(box).toBeLessThanOrEqual(Math.min(0.7 * vh, 560) + 1);
  }
  const frames = page.locator('#work div[data-variant]:visible');
  await expect(frames).toHaveCount(isDesktop(page) ? 3 : 1);
  await expect(page.locator('#work fieldset')).toBeVisible({ visible: !isDesktop(page) });
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.snapshotPath('work.png'), fullPage: true });

  const axe = await new AxeBuilder({ page }).include('#work').exclude('#work iframe') // the framed pages are not our markup
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
});

test('at 375x667 the page outside the preview stays touchable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await open(page);
  const frame = firstFrame(page);
  await scrollIntoView(frame);
  const scroller = await firstScroller(page).boundingBox();
  expect(scroller!.height).toBeLessThanOrEqual(Math.min(0.7 * 667, 560) + 1);
  expect(scroller!.height, 'room left on screen beside the preview').toBeLessThan(667 - 120);
});

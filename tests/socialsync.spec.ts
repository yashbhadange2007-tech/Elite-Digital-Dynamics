import type { Page } from '@playwright/test';
import { expect, expectNoHorizontalOverflow, test } from './fixtures';

/**
 * SocialSync demo (docs/ARCHITECTURE.md 5, acceptance checks D1, D2, D3, D7, D9).
 * The demo root carries data-step, data-screen, data-mode and data-running for these tests.
 */

const ROUTE = '/preview/socialsync';
const LABEL = 'Sample data, nothing is posted';

const demo = (page: Page) => page.locator('[data-socialsync]');
const app = (page: Page) => page.getByRole('group', { name: 'SocialSync demo app' });

async function openDemo(page: Page, path = ROUTE) {
  await page.goto(path);
  await page.locator('[data-demo-slot]').scrollIntoViewIfNeeded();
  await expect(demo(page)).toBeVisible();
  await page.locator('[data-demo-frame]').evaluate((el) => el.scrollIntoView({ block: 'center' }));
}

async function expectStep(page: Page, step: string, timeout = 12_000) {
  await expect(demo(page)).toHaveAttribute('data-step', step, { timeout });
  await expect(page.getByText(LABEL, { exact: true }), `label visible at step ${step}`).toBeVisible();
}

test('D1 + D3: the tour runs the whole story by itself, with the sample label at every step', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await openDemo(page);
  await expect(page.locator('#demo').getByText('Built for IPMH, Pune', { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await expectStep(page, 'create');
  // Filled by the tour: media, all three platforms, text, YouTube title.
  await expect(app(page).getByRole('img', { name: /Tip card/ }).first()).toBeVisible({ timeout: 4000 });
  for (const name of ['Instagram', 'Facebook Page', 'YouTube']) {
    await expect(app(page).getByRole('checkbox', { name, exact: true })).toBeChecked({ timeout: 6000 });
  }
  await expect(app(page).getByLabel('YouTube title (required for YouTube)')).toHaveValue(/desk workers$/, { timeout: 10_000 });

  await expectStep(page, 'schedule');
  await expect(app(page).getByLabel('Time (IST)', { exact: true })).toBeVisible({ timeout: 4000 });
  await expect(app(page).getByText(/^Goes live .* IST$/)).toBeVisible();

  await expectStep(page, 'preview');
  await expect(app(page).getByRole('article', { name: 'YouTube preview' })).toBeVisible({ timeout: 8000 });

  await expectStep(page, 'publish');
  await expect(app(page).getByText('Scheduled on 3 platforms')).toBeVisible({ timeout: 8000 });

  await expectStep(page, 'published');
  const countdown = app(page).locator('[data-countdown]');
  const first = await countdown.textContent();
  await expect(countdown).not.toHaveText(first ?? '', { timeout: 2500 });
  await page.screenshot({ path: testInfo.snapshotPath('published.png') });

  // Shortened: jump to Analytics, then watch compare and the restart.
  await page.getByRole('group', { name: 'Jump to a step' }).getByRole('button', { name: 'Analytics' }).click();
  await expectStep(page, 'analytics');
  await expectStep(page, 'compare', 8000);
  await expect(app(page).getByRole('table')).toBeVisible();
  await expectStep(page, 'start', 9000);
  await expect(demo(page)).toHaveAttribute('data-screen', 'home');
});

test('D2: chips jump, a click takes control, resume continues, Create post works by hand', async ({ page }) => {
  test.setTimeout(60_000);
  await openDemo(page);
  const chips = page.getByRole('group', { name: 'Jump to a step' });

  for (const [chip, step] of [
    ['Schedule', 'schedule'],
    ['Published', 'published'],
    ['Analytics', 'analytics'],
    ['Create', 'create'],
  ] as const) {
    await chips.getByRole('button', { name: chip }).click();
    await expect(demo(page)).toHaveAttribute('data-step', step);
    await expect(chips.getByRole('button', { name: chip })).toHaveAttribute('aria-current', 'step');
  }

  // Any pointer press inside takes control.
  await app(page).getByRole('heading', { name: 'Create post' }).click();
  await expect(demo(page)).toHaveAttribute('data-mode', 'manual');
  const tourButton = page.getByRole('button', { name: 'Resume tour' });
  await expect(tourButton).toBeVisible();
  await tourButton.click();
  await expect(page.getByRole('button', { name: 'Pause tour' })).toBeVisible();
  await expect(app(page).getByRole('checkbox', { name: 'Instagram', exact: true })).toBeChecked({ timeout: 5000 });

  // A key press inside also takes control.
  await app(page).getByRole('button', { name: 'Create post' }).focus();
  await page.keyboard.press('Shift');
  await expect(demo(page)).toHaveAttribute('data-mode', 'manual');

  // Create post by hand: YouTube only, the title rule, own text, now vs later, preview, publish.
  await chips.getByRole('button', { name: 'Create' }).click();
  const a = app(page);
  await a.getByRole('button', { name: 'Add photo or video' }).click();
  await expect(a.getByRole('button', { name: 'Remove' })).toBeVisible();
  await a.getByRole('checkbox', { name: 'YouTube', exact: true }).check();
  await a.getByLabel('Post text').fill('Shoulder rolls between patients.');
  await a.getByRole('button', { name: 'Preview' }).click();
  const publish = a.getByRole('button', { name: 'Publish now' });
  await expect(publish).toBeDisabled();
  await expect(a.getByText('Add a YouTube title to publish on YouTube.')).toBeVisible();

  await a.getByRole('button', { name: 'Write' }).click();
  await a.getByLabel('YouTube title (required for YouTube)').fill('Shoulder rolls in one minute');
  await a.getByRole('checkbox', { name: 'Instagram', exact: true }).check();
  await a.getByRole('checkbox', { name: 'Own text for Instagram' }).check();
  await a.getByRole('textbox', { name: 'Text for Instagram' }).fill('Instagram-only caption.');
  await a.getByRole('button', { name: 'Next: when' }).click();

  await a.getByRole('radio', { name: /Schedule for later/ }).check();
  await expect(a.getByLabel('Date (IST)', { exact: true })).toBeVisible();
  await expect(a.getByLabel('Time (IST)', { exact: true })).toBeVisible();
  await a.getByRole('radio', { name: /Post now/ }).check();
  await expect(a.getByLabel('Time (IST)', { exact: true })).toHaveCount(0);
  await a.getByRole('button', { name: 'Next: preview' }).click();

  const previews = a.getByRole('group', { name: 'Preview for' });
  await previews.getByRole('button', { name: 'Instagram' }).click();
  await expect(a.getByRole('article', { name: 'Instagram preview' })).toContainText('Instagram-only caption.');
  await previews.getByRole('button', { name: 'YouTube' }).click();
  await expect(a.getByRole('article', { name: 'YouTube preview' })).toContainText('Shoulder rolls in one minute');
  await expect(publish).toBeEnabled();
  await publish.click();
  await expect(a.getByText('Published on 2 platforms')).toBeVisible({ timeout: 5000 });
  await a.getByRole('button', { name: 'Go to Home' }).click();
  await expect(demo(page)).toHaveAttribute('data-step', 'published');

  // Analytics: per platform and compare.
  await a.getByRole('navigation', { name: 'SocialSync' }).getByRole('button', { name: 'Analytics' }).click();
  await expect(a.getByRole('heading', { name: 'YouTube' })).toBeVisible();
  await a.getByRole('button', { name: 'Compare platforms' }).click();
  await expect(a.getByRole('rowheader', { name: 'Best day and time (IST)' })).toBeVisible();
  await a.getByRole('button', { name: 'By platform' }).click();
  await expect(a.getByRole('table')).toHaveCount(0);
  await expect(page.getByText(LABEL, { exact: true })).toBeVisible();
});

test.describe('D7: pausing', () => {
  test('stops while less than a quarter is on screen, and while the tab is hidden', async ({ page }) => {
    test.setTimeout(60_000);
    await openDemo(page, `${ROUTE}?gap=1`);
    await expect(demo(page)).toHaveAttribute('data-running', 'true');

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(demo(page)).toHaveAttribute('data-running', 'false');
    const step = await demo(page).getAttribute('data-step');
    const screen = await app(page).getByRole('region').getAttribute('aria-label');
    await page.waitForTimeout(10_000);
    await expect(demo(page)).toHaveAttribute('data-step', step!);
    await expect(app(page).getByRole('region')).toHaveAttribute('aria-label', screen!);

    await page.locator('[data-demo-frame]').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect(demo(page)).toHaveAttribute('data-running', 'true');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(demo(page)).toHaveAttribute('data-running', 'false');
    const hiddenStep = await demo(page).getAttribute('data-step');
    // Everything inside the app except the live countdown, which keeps ticking by design.
    const snapshot = () =>
      app(page).evaluate((el) => {
        const copy = el.cloneNode(true) as HTMLElement;
        copy.querySelectorAll('[data-countdown]').forEach((c) => c.remove());
        return copy.innerHTML;
      });
    const before = await snapshot();
    await page.waitForTimeout(10_000);
    await expect(demo(page)).toHaveAttribute('data-step', hiddenStep!);
    expect(await snapshot(), 'nothing changed inside the app').toBe(before);
  });

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('never starts by itself; the chips still work', async ({ page }) => {
      await openDemo(page);
      await expect(demo(page)).toHaveAttribute('data-mode', 'manual');
      await expect(page.getByRole('button', { name: 'Resume tour' })).toBeVisible();
      await page.waitForTimeout(5000);
      await expect(demo(page)).toHaveAttribute('data-step', 'start');
      await page.getByRole('group', { name: 'Jump to a step' }).getByRole('button', { name: 'Analytics' }).click();
      await expect(demo(page)).toHaveAttribute('data-step', 'analytics');
      await page.waitForTimeout(5000);
      await expect(demo(page)).toHaveAttribute('data-step', 'analytics');
    });
  });
});

test('D9: the demo and Figtree load only near the viewport, with no layout shift', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto(`${ROUTE}?gap=1`);
  await page.waitForLoadState('networkidle');

  const figtreeUrl = await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      for (const rule of sheet.cssRules) {
        const src = rule instanceof CSSFontFaceRule ? /url\("?([^")]+)"?\)/.exec(rule.style.getPropertyValue('src')) : null;
        if (src && /figtree/i.test((rule as CSSFontFaceRule).style.getPropertyValue('font-family'))) {
          return new URL(src[1], sheet.href ?? location.href).href;
        }
      }
    }
    return null;
  });
  expect(figtreeUrl, 'Figtree @font-face is present').toBeTruthy();
  const slot = page.locator('[data-demo-slot]');
  const before = await slot.boundingBox();
  const slotTop = await slot.evaluate((el) => el.getBoundingClientRect().top + scrollY);
  const vh = page.viewportSize()!.height;

  // 800px below the viewport: nothing yet.
  await page.evaluate((y) => window.scrollTo(0, y), slotTop - vh - 800);
  await page.waitForTimeout(800);
  await expect(demo(page)).toHaveCount(0);
  expect(requests.filter((u) => u === figtreeUrl)).toEqual([]);
  const scriptsBefore = new Set(requests.filter((u) => u.endsWith('.js')));

  // 400px below the viewport: the demo loads.
  await page.evaluate((y) => window.scrollTo(0, y), slotTop - vh - 400);
  await expect(demo(page)).toHaveCount(1);
  expect(requests.filter((u) => u.endsWith('.js') && !scriptsBefore.has(u)).length, 'demo chunk loads late').toBeGreaterThan(0);
  await expect.poll(() => requests.includes(figtreeUrl!), { message: 'Figtree loads with the demo' }).toBe(true);
  expect((await slot.boundingBox())!.height).toBeCloseTo(before!.height, 0);
});

test('D9: swapping the skeleton for the demo on screen shifts nothing', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __shift: number }).__shift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number; sources: { node?: Node }[] }[]) {
        const slot = document.querySelector('[data-demo-slot]');
        if (entry.sources.some((s) => s.node && slot?.contains(s.node))) {
          (window as unknown as { __shift: number }).__shift += entry.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(ROUTE);
  await expect(demo(page)).toBeVisible();
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => (window as unknown as { __shift: number }).__shift)).toBe(0);
});

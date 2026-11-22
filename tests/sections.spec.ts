import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, expectNoHorizontalOverflow, test } from './fixtures';

/**
 * Static sections (agent C): navigation, hero, services, how we work, FAQ and footer.
 * Runs against /preview/sections, plus / and /privacy for the navigation targets.
 */

// The dev server is shared: another area's edit can hot-reload the page in the middle of a test.
test.describe.configure({ retries: 1 });

const PREVIEW = '/preview/sections';
const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const TARGETS = [
  { label: 'Services', id: 'services' },
  { label: 'Work', id: 'work' },
  { label: 'Process', id: 'process' },
  { label: 'FAQ', id: 'faq' },
  { label: 'Start a project', id: 'contact' },
];

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;
const menuButton = (page: Page) => page.locator('header button[popovertarget]');
const menu = (page: Page) => page.locator('#site-menu');
const menuIsOpen = (page: Page) => menu(page).evaluate((sheet) => sheet.matches(':popover-open'));

/** Waits until scrolling (smooth anchor jumps, late layout) has stopped. */
async function settle(page: Page) {
  let last = -1;
  let still = 0;
  await expect
    .poll(
      async () => {
        const y = await page.evaluate(() => Math.round(window.scrollY));
        still = y === last ? still + 1 : 0;
        last = y;
        return still;
      },
      { intervals: [150], timeout: 15_000 },
    )
    .toBeGreaterThanOrEqual(3);
}

/** Walks the page so every reveal has played and lazy parts have their final size. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(800); // the reveal transition is 720ms
}

test('hero fits the first screen at 360, 375, 768 and 1440', async ({ page }) => {
  for (const [width, height, maxLines] of [
    [360, 640, 4],
    [375, 812, 4],
    [768, 1024, 4],
    [1440, 900, 2],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(PREVIEW);
    const hero = page.locator('#top');
    const parts = [
      hero.locator('.ui-eyebrow'),
      hero.getByRole('heading', { level: 1 }),
      hero.locator('p.ui-lead'),
      hero.getByRole('link', { name: 'Start a project' }),
      hero.getByRole('link', { name: /^WhatsApp us/ }),
      hero.getByRole('link', { name: 'See our work' }),
    ];
    for (const part of parts) {
      await expect(part, `${width}x${height}`).toBeInViewport({ ratio: 1 });
    }
    const lines = await parts[1].evaluate((h1) => {
      const style = getComputedStyle(h1);
      return Math.round(h1.getBoundingClientRect().height / parseFloat(style.lineHeight));
    });
    expect(lines, `h1 lines at ${width}`).toBeLessThanOrEqual(maxLines);
    expect(await hero.evaluate((el) => el.getBoundingClientRect().height), 'hero is one screen').toBeGreaterThanOrEqual(height);
  }
});

test('nav: one line, at most 72px, glass pill after scrolling', async ({ page }) => {
  const widths = isDesktop(page) ? [1024, 1440] : [page.viewportSize()!.width, 360];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(PREVIEW);
    const header = page.locator('body > header');
    const box = (await header.boundingBox())!;
    expect(box.height, `nav height at ${width}`).toBeLessThanOrEqual(72);

    // Everything visible in the bar sits on one line and nothing overlaps or leaves the screen.
    const items = await header.locator('a:visible, button:visible').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { name: el.textContent, left: r.left, right: r.right, centre: r.top + r.height / 2 };
      }),
    );
    // Phones and tablets, top of the page: the full lockup and the menu button. The pink button
    // joins after scrolling, because the hero has its own right below (one pink button per screen).
    expect(items.length, `items in the bar at ${width}`).toBe(width >= 1024 ? 6 : 2);
    const navCta = header.getByRole('link', { name: 'Start a project' });
    if (width < 1024) await expect(navCta).toBeHidden();
    for (const [index, item] of items.entries()) {
      expect(Math.abs(item.centre - items[0].centre), `${item.name} on the nav line`).toBeLessThanOrEqual(2);
      expect(item.left).toBeGreaterThanOrEqual(0);
      expect(item.right).toBeLessThanOrEqual(width);
      if (index > 0) expect(item.left, `${item.name} clear of its neighbour`).toBeGreaterThanOrEqual(items[index - 1].right);
    }

    const pill = header.locator('nav');
    await expect(pill).not.toHaveClass(/ui-glass/);
    await expect(pill).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
    await expect(pill).toHaveClass(/ui-glass/);
    await expect(pill).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    const isPill = await pill.evaluate((el) => parseFloat(getComputedStyle(el).borderRadius) >= el.getBoundingClientRect().height / 2);
    expect(isPill, 'pill shape').toBe(true);
    expect((await header.boundingBox())!.height, 'no height change when the pill appears').toBe(box.height);
    await expect(navCta).toBeVisible();
    expect((await navCta.boundingBox())!.x + (await navCta.boundingBox())!.width).toBeLessThanOrEqual(width);
  }
});

test('phone menu opens and closes by tap, Escape, outside tap and link tap', async ({ page }) => {
  test.skip(isDesktop(page), 'the menu exists below 1024px only');
  await page.goto(PREVIEW);
  const button = menuButton(page);
  await expect(button).toHaveAccessibleName('Menu');

  // Tap: opens, focus moves into the sheet, the button says what it now does.
  await button.click();
  expect(await menuIsOpen(page)).toBe(true);
  await expect(menu(page).getByRole('link', { name: 'Services' })).toBeFocused();
  await expect(button).toHaveAccessibleName('Close menu');
  await expect(menu(page).getByRole('link')).toHaveText(['Services', 'Work', 'Process', 'FAQ', /^Call/, /^WhatsApp/]);
  await expectNoHorizontalOverflow(page);

  // Escape: closes and focus returns to the button.
  await page.keyboard.press('Escape');
  expect(await menuIsOpen(page)).toBe(false);
  await expect(button).toBeFocused();
  await expect(button).toHaveAccessibleName('Menu');

  // The button itself closes it again.
  await button.click();
  expect(await menuIsOpen(page)).toBe(true);
  await button.click();
  expect(await menuIsOpen(page)).toBe(false);

  // Outside tap.
  await button.click();
  expect(await menuIsOpen(page)).toBe(true);
  const { width, height } = page.viewportSize()!;
  await page.mouse.click(width / 2, height - 40);
  expect(await menuIsOpen(page)).toBe(false);

  // Link tap: closes and goes to the section.
  await button.click();
  await menu(page).getByRole('link', { name: 'Process' }).click();
  expect(await menuIsOpen(page)).toBe(false);
  await expect(page).toHaveURL(/#process$/);
});

for (const start of ['/', '/privacy']) {
  test(`nav links land on their sections from ${start}`, async ({ page }) => {
    test.setTimeout(120_000);
    for (const target of TARGETS) {
      await page.goto(start);
      const header = page.locator('body > header');
      if (target.id !== 'contact' && !isDesktop(page)) {
        await menuButton(page).click();
        await menu(page).getByRole('link', { name: target.label }).click();
      } else {
        // On phones the nav's button appears once the page has scrolled past the hero's own.
        if (!isDesktop(page)) await page.evaluate(() => window.scrollTo({ top: 120, behavior: 'instant' }));
        await header.getByRole('link', { name: target.label }).click();
      }
      await expect(page).toHaveURL(new RegExp(`/#${target.id}$`));
      const heading = page.locator(`#${target.id}`).getByRole('heading', { level: 2 }).first();
      await expect(heading).toBeVisible();
      await settle(page);
      const navBottom = (await header.boundingBox())!.height;
      const top = await heading.evaluate((h) => h.getBoundingClientRect().top);
      expect(top, `${target.label}: heading below the nav`).toBeGreaterThanOrEqual(navBottom);
      await expect(heading, `${target.label}: heading on screen`).toBeInViewport({ ratio: 1 });
    }
  });
}

test('FAQ: six native details, one open at a time, Enter and Space toggle', async ({ page }) => {
  await page.goto(PREVIEW);
  const items = page.locator('#faq details');
  await expect(items).toHaveCount(6);
  expect(await items.evaluateAll((all) => new Set(all.map((d) => d.getAttribute('name'))).size)).toBe(1);

  const openState = () => items.evaluateAll((all) => all.map((d) => (d as HTMLDetailsElement).open));
  expect(await openState()).toEqual([true, false, false, false, false, false]);

  await items.nth(1).locator('summary').click();
  expect(await openState()).toEqual([false, true, false, false, false, false]);
  await expect(items.nth(1).locator('p')).toBeVisible();
  await expect(items.nth(0).locator('p')).toBeHidden();

  const third = items.nth(2).locator('summary');
  await third.focus();
  await page.keyboard.press('Enter');
  expect(await openState()).toEqual([false, false, true, false, false, false]);
  await expect(items.nth(2).locator('p')).toBeVisible();
  await page.keyboard.press('Space');
  expect(await openState()).toEqual([false, false, false, false, false, false]);
  await page.keyboard.press('Space');
  expect(await openState()).toEqual([false, false, true, false, false, false]);
});

test('footer: lockup, links, contact, copyright, and a motion control that survives a reload', async ({ page }) => {
  await page.goto(PREVIEW);
  const footer = page.locator('body > footer');
  await footer.scrollIntoViewIfNeeded();

  await expect(footer.locator('img[src="/brand/edd-lockup-stacked.svg"]')).toBeVisible();
  await expect(footer.getByText('Elite Digital Dynamics', { exact: true })).toHaveCount(1);
  const links = footer.getByRole('navigation', { name: 'Footer' }).getByRole('link');
  await expect(links).toHaveText(['Services', 'Work', 'Process', 'FAQ', 'Start a project']);
  expect(await links.evaluateAll((all) => all.map((a) => a.getAttribute('href')))).toEqual([
    '/#services',
    '/#work',
    '/#process',
    '/#faq',
    '/#contact',
  ]);
  await expect(footer.getByRole('link', { name: '+91 92260 46693' })).toHaveAttribute('href', 'tel:+919226046693');
  await expect(footer.getByRole('link', { name: 'elitedigitaldynamics.26@gmail.com' })).toHaveAttribute(
    'href',
    'mailto:elitedigitaldynamics.26@gmail.com',
  );
  await expect(footer.getByText('102-B Devratna Apartment, Shirole Gali, Shivaji Nagar, Pune')).toBeVisible();
  await expect(footer.getByText('© 2026 Elite Digital Dynamics, Pune.', { exact: true })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');

  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-motion', 'full');
  await footer.getByRole('button', { name: 'Pause motion' }).click();
  await expect(html).toHaveAttribute('data-motion', 'still');
  await page.reload();
  await expect(html).toHaveAttribute('data-motion', 'still');
  await page.locator('body > footer').getByRole('button', { name: 'Play motion' }).click();
  await expect(html).toHaveAttribute('data-motion', 'full');
  await page.reload();
  await expect(html).toHaveAttribute('data-motion', 'full');
});

test('no horizontal overflow at 360, 375, 768 and 1440', async ({ page }) => {
  for (const width of [360, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(PREVIEW);
    await scrollThrough(page);
    await expectNoHorizontalOverflow(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `scrollWidth at ${width}`).toBeLessThanOrEqual(width);
  }
});

test('accessibility: axe WCAG 2.1 AA, one h1, headings in order, one eyebrow', async ({ page }, testInfo) => {
  await page.goto(PREVIEW);
  await scrollThrough(page);

  const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);

  const levels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((all) => all.map((h) => Number(h.tagName[1])));
  expect(levels.filter((level) => level === 1)).toHaveLength(1);
  expect(levels[0]).toBe(1);
  for (let i = 1; i < levels.length; i++) {
    expect(levels[i] - levels[i - 1], `heading ${i + 1} skips a level`).toBeLessThanOrEqual(1);
  }
  await expect(page.locator('.ui-eyebrow')).toHaveCount(1);
  await expect(page.locator('#top .ui-eyebrow')).toHaveText('Digital agency in Pune');

  if (!isDesktop(page)) {
    await menuButton(page).click();
    const open = await new AxeBuilder({ page }).withTags(WCAG_AA).include('body > header').analyze();
    expect(open.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    await page.keyboard.press('Escape');
  }

  await page.screenshot({ path: testInfo.snapshotPath('hero.png') });
  await page.locator('#services').scrollIntoViewIfNeeded();
  await page.locator('#services .ui-glass').screenshot({ path: testInfo.snapshotPath('services.png') });
});

// Its own context: with scripts off the browser reports every blocked script file as a failed
// request, which the shared guard on the default page would count as a broken page.
test('without JavaScript all section text is visible', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  try {
    await page.goto(PREVIEW);
    await expect(page.locator('#services ol > li h3')).toHaveCount(5);
    await expect(page.locator('#services ol > li ul > li')).toHaveCount(15);
    await expect(page.locator('#process ol > li')).toHaveCount(5);
    await expect(page.locator('#faq summary')).toHaveCount(6);

    // Every element that carries text is painted: not hidden, not transparent, not zero-sized.
    // Closed FAQ answers are the one exception; the browser opens them without script (below).
    const hidden = await page.evaluate(() => {
      const problems: string[] = [];
      for (const el of document.querySelectorAll('main :is(h1, h2, h3, p, li, summary, a), body > footer :is(p, a, button)')) {
        if (el.closest('details:not([open])') && !el.closest('summary')) continue;
        let opacity = 1;
        for (let node: Element | null = el; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (opacity < 1 || style.visibility !== 'visible' || rect.width === 0 || rect.height === 0) {
          problems.push(`${el.tagName} "${el.textContent?.slice(0, 40)}"`);
        }
      }
      return problems;
    });
    expect(hidden).toEqual([]);

    await page.locator('#faq summary').nth(4).click();
    await expect(page.locator('#faq details').nth(4).locator('p')).toBeVisible();
    await expect(page.locator('#faq details').nth(0).locator('p')).toBeHidden();
  } finally {
    await context.close();
  }
});

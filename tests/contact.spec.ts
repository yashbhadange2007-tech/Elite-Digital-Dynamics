import AxeBuilder from '@axe-core/playwright';
import type { Page, Request, Route } from '@playwright/test';
import { expect, expectNoHorizontalOverflow, test } from './fixtures';

/**
 * Enquiry form, contact block and logo stage (agent E), on /preview/contact.
 * `?key=none` is the shipped WhatsApp / email mode; `?key=demo` is key mode with a dummy key.
 * Web3Forms is ALWAYS mocked: every test routes api.web3forms.com and counts what reached it.
 */

// The dev server is shared: another area's edit can hot-reload the page in the middle of a test.
test.describe.configure({ retries: 1 });

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const API = 'https://api.web3forms.com/**';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };

const VISITOR = {
  name: 'Asha Patil',
  phone: '92260 46693',
  email: 'asha@example.in',
  business: 'Asha Salon & Spa',
  service: 'WhatsApp Automation',
  message: 'Two branches in Pune, we need booking reminders.',
};

const MSG = {
  summary: 'Please fix the following before sending:',
  name: 'Enter your name.',
  phone: 'Enter a 10-digit Indian mobile number, for example 98765 43210.',
  email: 'That email address does not look right.',
  notice: 'This opens WhatsApp or your email app with your details filled in. Nothing is sent until you press send there.',
  openedWa: 'WhatsApp opened with your message. Press send there to reach us.',
  openedMail: 'Your email app opened with your message. Press send there to reach us.',
  failure: 'That did not go through. Your details are still here. Try again, or send them on WhatsApp or by email.',
};

const field = {
  name: (page: Page) => page.getByLabel('Your name'),
  phone: (page: Page) => page.getByLabel('Phone number'),
  email: (page: Page) => page.getByLabel('Email'),
  business: (page: Page) => page.getByLabel('Business name'),
  service: (page: Page) => page.getByLabel('What do you need?'),
  message: (page: Page) => page.getByLabel('Message'),
};

/** Routes Web3Forms with `respond` and records every request that got there. */
async function mockApi(page: Page, respond: (route: Route) => Promise<void>) {
  const calls: Request[] = [];
  await page.route(API, async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    calls.push(route.request());
    try {
      await respond(route);
    } catch {
      /* the page gave up on the request first (timeout test) */
    }
  });
  return calls;
}

const json = (status: number, body: object) => (route: Route) =>
  route.fulfill({ status, headers: CORS, contentType: 'application/json', body: JSON.stringify(body) });

/** Replaces window.open (the one seam both openers use) so nothing leaves the page. */
async function recordOpens(page: Page) {
  await page.addInitScript(() => {
    const opened: string[] = [];
    (window as unknown as { __opened: string[] }).__opened = opened;
    window.open = (url) => {
      opened.push(String(url));
      return null;
    };
  });
}
const opened = (page: Page) => page.evaluate(() => (window as unknown as { __opened: string[] }).__opened);

async function open(page: Page, query = 'key=none') {
  await page.goto(`/preview/contact?${query}`);
  // Hydrated: React has attached its props to the form.
  await page.waitForFunction(() => {
    const form = document.querySelector('#contact form');
    return !!form && Object.keys(form).some((key) => key.startsWith('__reactProps'));
  });
}

async function fill(page: Page) {
  await field.name(page).fill(VISITOR.name);
  await field.phone(page).fill(VISITOR.phone);
  await field.email(page).fill(VISITOR.email);
  await field.business(page).fill(VISITOR.business);
  await field.service(page).selectOption(VISITOR.service);
  await field.message(page).fill(VISITOR.message);
}

async function expectEntriesKept(page: Page) {
  for (const [key, value] of Object.entries(VISITOR)) await expect(field[key as keyof typeof VISITOR](page)).toHaveValue(value);
}

test.describe('logo stage (E8)', () => {
  test('one square stage with the 2D mark as the fallback, tagline under it', async ({ page }) => {
    await open(page);
    const stage = page.locator('[data-logo-stage]');
    await expect(stage).toHaveCount(1);
    await expect(stage).toHaveAttribute('data-pose', 'contact');
    await expect(page.locator('[data-pose="contact"]')).toHaveCount(1);
    await expect(page.locator('#contact')).not.toHaveAttribute('data-pose');

    const size = (page.viewportSize()?.width ?? 0) >= 1024 ? 220 : 168;
    const box = (await stage.boundingBox())!;
    expect([box.width, box.height]).toEqual([size, size]);

    const mark = stage.locator('img');
    await expect(mark).toHaveAttribute('src', '/brand/edd-mark.svg');
    await expect(mark).toBeVisible();
    await page.evaluate(() => (document.documentElement.dataset.scene = 'live'));
    await expect(mark).toBeHidden();
    await page.evaluate(() => (document.documentElement.dataset.scene = 'poster'));
    await expect(mark).toBeVisible();

    const tagline = page.getByText('Your Vision, Our Innovation', { exact: true });
    expect((await tagline.boundingBox())!.y).toBeGreaterThanOrEqual(box.y + box.height);
  });
});

test.describe('contact block (E7)', () => {
  test('phones, email, WhatsApp and address match site.ts', async ({ page }) => {
    await open(page);
    const block = page.locator('#contact');
    await expect(block.locator('a[href="tel:+919226046693"]')).toContainText('+91 92260 46693');
    await expect(block.locator('a[href="tel:+919284507574"]')).toContainText('+91 92845 07574');
    await expect(block.locator('a[href="mailto:elitedigitaldynamics.26@gmail.com"]')).toHaveText(/elitedigitaldynamics\.26@gmail\.com/);
    await expect(block.getByRole('link', { name: /Chat on WhatsApp/ })).toHaveAttribute('href', 'https://wa.me/919226046693');
    await expect(block.locator('address')).toHaveText('102-B Devratna Apartment, Shirole Gali, Shivaji Nagar, Pune');
  });
});

test.describe('no-key mode (E2, E3)', () => {
  test('invalid submit: summary, focus, exact messages, cleared on blur', async ({ page }) => {
    const calls = await mockApi(page, json(500, {}));
    await open(page);
    await expect(page.getByText(MSG.notice)).toBeVisible();

    await field.email(page).fill('asha@');
    await page.getByRole('button', { name: 'Send on WhatsApp' }).click();

    const summary = page.locator('#contact').getByRole('alert');
    await expect(summary).toContainText(MSG.summary);
    await expect(field.name(page)).toBeFocused();
    for (const key of ['name', 'phone', 'email'] as const) {
      await expect(field[key](page)).toHaveAttribute('aria-invalid', 'true');
      await expect(field[key](page)).toHaveAccessibleDescription(new RegExp(MSG[key].replace(/\./g, '\\.')));
      await expect(page.locator(`#enquiry-${key}-error`)).toHaveText(MSG[key]);
    }
    await expect(field.business(page)).toHaveAttribute('aria-invalid', 'false');

    await field.name(page).fill(VISITOR.name);
    await expect(page.locator('#enquiry-name-error')).toHaveText(MSG.name); // not before blur
    await page.keyboard.press('Tab');
    await expect(page.locator('#enquiry-name-error')).toHaveCount(0);
    await expect(field.name(page)).toHaveAttribute('aria-invalid', 'false');
    await expect(summary).not.toContainText('Your name');

    await field.phone(page).fill('5226046693');
    await page.keyboard.press('Tab');
    await expect(page.locator('#enquiry-phone-error')).toHaveText(MSG.phone);
    expect(calls).toHaveLength(0);
  });

  test('WhatsApp and email open pre-filled, say "opened", keep the entries', async ({ page }) => {
    const calls = await mockApi(page, json(500, {}));
    await recordOpens(page);
    await open(page);
    await fill(page);

    await page.getByRole('button', { name: 'Send on WhatsApp' }).click();
    await expect(page.locator('#contact').getByRole('status')).toContainText(MSG.openedWa);
    await expect(page.locator('#contact').getByRole('status').getByRole('link', { name: 'Call +91 92260 46693' })).toHaveAttribute('href', 'tel:+919226046693');
    let urls = await opened(page);
    expect(urls).toHaveLength(1);
    const wa = new URL(urls[0]);
    expect(wa.origin + wa.pathname).toBe('https://wa.me/919226046693');
    const text = wa.searchParams.get('text')!;
    for (const value of [VISITOR.name, '+919226046693', VISITOR.email, VISITOR.business, VISITOR.service, VISITOR.message]) {
      expect(text).toContain(value);
    }
    await expectEntriesKept(page);

    await page.getByRole('button', { name: 'Send by email' }).click();
    await expect(page.locator('#contact').getByRole('status')).toContainText(MSG.openedMail);
    urls = await opened(page);
    expect(urls).toHaveLength(2);
    expect(urls[1].startsWith('mailto:elitedigitaldynamics.26@gmail.com?')).toBe(true);
    const query = new URLSearchParams(urls[1].split('?')[1]);
    expect(query.get('subject')).toBe(`Project enquiry from ${VISITOR.name}`);
    for (const value of [VISITOR.name, '+919226046693', VISITOR.email, VISITOR.business, VISITOR.service, VISITOR.message]) {
      expect(query.get('body')).toContain(value);
    }
    await expectEntriesKept(page);

    // "sent" never appears as a claim: only inside the notice ("Nothing is sent until...").
    const form = await page.locator('#contact form').innerText();
    expect(form.replace(MSG.notice, '')).not.toMatch(/\bsent\b/i);
    expect(calls).toHaveLength(0);
  });
});

test.describe('key mode against mocks (E4)', () => {
  test('success: body, thanks panel with focus, Send another', async ({ page }) => {
    const calls = await mockApi(page, json(200, { success: true, message: 'Email sent successfully!' }));
    await open(page, 'key=demo');
    await fill(page);
    await page.getByRole('button', { name: 'Send enquiry' }).click();

    const panel = page.locator('#contact').getByRole('status');
    const heading = panel.getByRole('heading', { name: `Thanks, ${VISITOR.name}. Your enquiry is with us.` });
    await expect(heading).toBeFocused();
    await expect(panel).toContainText('We will reply by phone or email.');

    expect(calls).toHaveLength(1);
    expect(calls[0].method()).toBe('POST');
    expect(calls[0].postDataJSON()).toEqual({
      access_key: 'demo-key-for-tests',
      subject: `New enquiry from ${VISITOR.name}`,
      from_name: 'Elite Digital Dynamics website',
      ...VISITOR,
      phone: '+919226046693',
      botcheck: false,
    });

    await page.getByRole('button', { name: 'Send another' }).click();
    await expect(field.name(page)).toBeFocused();
    for (const key of Object.keys(field) as (keyof typeof field)[]) await expect(field[key](page)).toHaveValue('');
    expect(calls).toHaveLength(1);
  });

  test('pending: "Sending…" on an aria-disabled button', async ({ page }) => {
    let release = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    const calls = await mockApi(page, async (route) => {
      await held;
      await json(200, { success: true })(route);
    });
    await open(page, 'key=demo');
    await fill(page);
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    const button = page.getByRole('button', { name: 'Sending…' });
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(await button.evaluate((el: HTMLButtonElement) => el.disabled)).toBe(false); // aria-disabled, not disabled
    await button.click({ force: true }); // a second press sends nothing more
    release();
    await expect(page.getByRole('heading', { name: /Thanks, Asha Patil/ })).toBeFocused();
    expect(calls).toHaveLength(1);
  });

  const failures: [string, string, (route: Route) => Promise<void>][] = [
    ['HTTP 400', '', json(400, { success: false, message: 'Invalid access key' })],
    ['HTTP 429', '', json(429, { success: false, message: 'Too many requests' })],
    ['200 with success false', '', json(200, { success: false, message: 'Spam detected' })],
    ['aborted request', '', (route) => route.abort('connectionreset')],
    ['timeout', '&timeout=1000', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await json(200, { success: true })(route);
    }],
  ];

  for (const [name, query, respond] of failures) {
    test(`failure (${name}): message, entries kept, both fallbacks offered`, async ({ page }) => {
      const calls = await mockApi(page, respond);
      await recordOpens(page);
      await open(page, `key=demo${query}`);
      await fill(page);
      await page.getByRole('button', { name: 'Send enquiry' }).click();

      await expect(page.locator('#contact').getByRole('alert').filter({ hasText: MSG.failure })).toBeVisible();
      await expectEntriesKept(page);
      await expect(page.getByRole('button', { name: 'Send on WhatsApp' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Send by email' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Send enquiry' })).toBeVisible();
      expect(calls).toHaveLength(1);

      await page.getByRole('button', { name: 'Send on WhatsApp' }).click();
      await expect(page.locator('#contact').getByRole('status')).toContainText(MSG.openedWa);
      expect((await opened(page))[0]).toMatch(/^https:\/\/wa\.me\/919226046693\?text=/);
      expect(calls).toHaveLength(1);
    });
  }
});

test.describe('spam (E5)', () => {
  test('honeypot ticked: thanks shown, nothing sent', async ({ page }) => {
    const calls = await mockApi(page, json(200, { success: true }));
    await open(page, 'key=demo');
    const trap = page.locator('input[name="botcheck"]');
    await expect(trap).toHaveAttribute('tabindex', '-1');
    await expect(trap).toHaveAttribute('autocomplete', 'off');
    await expect(page.locator('div[aria-hidden="true"]:has(input[name="botcheck"])')).toHaveCount(1);
    await fill(page);
    await trap.evaluate((box: HTMLInputElement) => (box.checked = true));
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    await expect(page.getByRole('heading', { name: /Thanks, Asha Patil/ })).toBeFocused();
    expect(calls).toHaveLength(0);
  });

  test('autofill-speed submit right after load is sent, not dropped', async ({ page }) => {
    const calls = await mockApi(page, json(200, { success: true }));
    await open(page, 'key=demo');
    await page.evaluate((visitor) => {
      for (const [key, value] of Object.entries(visitor)) {
        (document.querySelector(`[name="${key}"]`) as HTMLInputElement).value = value;
      }
      document.querySelector<HTMLButtonElement>('button[value="web3forms"]')!.click();
    }, VISITOR);
    await expect(page.getByRole('heading', { name: /Thanks, Asha Patil/ })).toBeFocused();
    expect(calls).toHaveLength(1);
  });

  test('no-key mode has no honeypot and makes no request', async ({ page }) => {
    const calls = await mockApi(page, json(200, { success: true }));
    await open(page);
    await expect(page.locator('input[name="botcheck"]')).toHaveCount(0);
    expect(calls).toHaveLength(0);
  });
});

test.describe('accessibility and layout (E6, E9)', () => {
  test('labels, autocomplete, field size, full-width buttons on phones, no overflow', async ({ page }) => {
    await open(page);
    const expected = { name: 'name', phone: 'tel', email: 'email', business: 'organization' } as const;
    for (const [key, token] of Object.entries(expected)) {
      await expect(field[key as keyof typeof expected](page)).toHaveAttribute('autocomplete', token);
    }
    await expect(field.phone(page)).toHaveAttribute('type', 'tel');
    await expect(field.email(page)).toHaveAttribute('type', 'email');
    for (const key of ['name', 'phone', 'email', 'business', 'service'] as const) {
      const metrics = await field[key](page).evaluate((el) => [el.getBoundingClientRect().height, getComputedStyle(el).fontSize]);
      expect(metrics).toEqual([52, '16px']);
    }
    expect(await page.locator('#contact form').getAttribute('novalidate')).not.toBeNull();

    if ((page.viewportSize()?.width ?? 0) < 480) {
      const form = (await page.locator('#contact form').boundingBox())!;
      for (const name of ['Send on WhatsApp', 'Send by email']) {
        expect((await page.getByRole('button', { name }).boundingBox())!.width).toBeCloseTo(form.width, 0);
      }
    }
    await expectNoHorizontalOverflow(page);
  });

  test('keyboard alone: fill and send on WhatsApp', async ({ page }) => {
    await recordOpens(page);
    await open(page);
    await field.name(page).focus();
    await page.keyboard.type(VISITOR.name);
    await page.keyboard.press('Tab');
    await expect(field.phone(page)).toBeFocused();
    await page.keyboard.type(VISITOR.phone);
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab'); // email, business, service, message
    await expect(field.message(page)).toBeFocused();
    await page.keyboard.type(VISITOR.message);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Send on WhatsApp' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#contact').getByRole('status')).toContainText(MSG.openedWa);
    expect(await opened(page)).toHaveLength(1);
  });

  test('axe WCAG 2.1 AA: default, error, opened, success and failure', async ({ page }, testInfo) => {
    const axe = async (state: string) => {
      const { violations } = await new AxeBuilder({ page }).include('#contact').withTags(WCAG_AA).analyze();
      expect(violations.map((v) => `${state}: ${v.id} ${v.nodes.map((n) => n.target).join(' ')}`)).toEqual([]);
      await page.locator('#contact').screenshot({ path: testInfo.snapshotPath(`${state}.png`), animations: 'disabled' });
    };
    await recordOpens(page);
    await open(page);
    await axe('default');
    await page.getByRole('button', { name: 'Send on WhatsApp' }).click();
    await expect(page.locator('#contact').getByRole('alert')).toContainText(MSG.summary);
    await axe('error');
    await fill(page);
    await page.getByRole('button', { name: 'Send on WhatsApp' }).click();
    await expect(page.locator('#contact').getByRole('status')).toContainText(MSG.openedWa);
    await axe('opened');

    let fail = true;
    await mockApi(page, (route) => (fail ? json(429, {}) : json(200, { success: true }))(route));
    await open(page, 'key=demo');
    await fill(page);
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    await expect(page.locator('#contact').getByRole('alert').filter({ hasText: MSG.failure })).toBeVisible();
    await axe('failure');
    fail = false;
    await page.getByRole('button', { name: 'Send enquiry' }).click();
    await expect(page.getByRole('heading', { name: /Thanks, Asha Patil/ })).toBeFocused();
    await axe('success');
  });
});

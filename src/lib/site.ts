/**
 * The single registry of business facts. Every value is copied character for character from
 * docs/BRIEF.md. Nothing here is invented: no postal code, opening hours, coordinates or social
 * profiles exist yet, so they are not in this file (see SPEC.md section 4).
 *
 * No imports and only erasable TypeScript, so Node scripts can import this file directly.
 */

const PHONE_1 = '+91 92260 46693';
const PHONE_2 = '+91 92845 07574';
const EMAIL = 'elitedigitaldynamics.26@gmail.com';
const WHATSAPP_NUMBER = '919226046693';

/** `+91 92260 46693` -> `+919226046693` */
function e164(display: string): string {
  return display.replace(/\s+/g, '');
}

function phone(display: string) {
  return { display, e164: e164(display), tel: `tel:${e164(display)}` } as const;
}

/**
 * Site origin without a trailing slash.
 * 1. NEXT_PUBLIC_SITE_URL (the production domain, once the owner has one)
 * 2. the Vercel production URL (the NEXT_PUBLIC_ copy is the same value, readable in the browser)
 * 3. http://localhost:3000
 * Read it on the server (metadata, sitemap, robots, JSON-LD). Without NEXT_PUBLIC_SITE_URL the
 * browser bundle may not see the Vercel value, so do not render it from a client component.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const vercel =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return 'http://localhost:3000';
}

export const site = {
  name: 'Elite Digital Dynamics',
  /** Exactly as the owner writes it (also inside the stacked logo). */
  tagline: 'Your Vision Our Innovation',
  /** The form used in running text and metadata. */
  taglineDisplay: 'Your Vision, Our Innovation',
  phones: [phone(PHONE_1), phone(PHONE_2)],
  email: EMAIL,
  mailto: `mailto:${EMAIL}`,
  whatsapp: {
    /** Digits only, country code first, as wa.me expects. */
    number: WHATSAPP_NUMBER,
    display: PHONE_1,
  },
  address: {
    lines: ['102-B Devratna Apartment', 'Shirole Gali', 'Shivaji Nagar', 'Pune'],
    /** One line, as in the brief. */
    full: '102-B Devratna Apartment, Shirole Gali, Shivaji Nagar, Pune',
    /** Street part for structured data. */
    street: '102-B Devratna Apartment, Shirole Gali, Shivaji Nagar',
    locality: 'Pune',
    region: 'Maharashtra',
    country: 'IN',
  },
  siteUrl: resolveSiteUrl(),
} as const;

export type Site = typeof site;
export type Phone = Site['phones'][number];

/** WhatsApp chat link to the business number, optionally with a pre-filled message. */
export function waLink(text?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export type LaunchInput = {
  key: string;
  /** Environment variable that supplies it. */
  env: string;
  /** What breaks or is wrong without it. */
  why: string;
};

/**
 * Inputs the owner still owes, worked out from the environment (see .env.example). Empty once
 * both are set. The site runs without them: the origin falls back as described above and the
 * form ships in WhatsApp and email mode (ARCHITECTURE.md section 9, change 7).
 */
export const missingLaunchInputs: readonly LaunchInput[] = [
  ...(process.env.NEXT_PUBLIC_SITE_URL?.trim()
    ? []
    : [
        {
          key: 'siteUrl',
          env: 'NEXT_PUBLIC_SITE_URL',
          why: 'Production domain. Canonical URLs, the sitemap, the share image and the structured data use a fallback origin until it is set.',
        },
      ]),
  ...(process.env.NEXT_PUBLIC_WEB3FORMS_KEY?.trim()
    ? []
    : [
        {
          key: 'web3formsKey',
          env: 'NEXT_PUBLIC_WEB3FORMS_KEY',
          why: 'Web3Forms access key. Until it is set the enquiry form opens WhatsApp or the email app instead of sending directly.',
        },
      ]),
];

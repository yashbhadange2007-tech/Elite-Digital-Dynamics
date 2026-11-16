import type { ServiceId } from '@/lib/services';

/**
 * Every string of the static sections, copied character for character from SPEC.md section 3.
 * Service names come from src/lib/services.ts and contact details from src/lib/site.ts.
 */

/** Rendered by the root layout on every page, so the targets are `/#id`. */
export const NAV_LINKS = [
  { href: '/#services', label: 'Services' },
  { href: '/#work', label: 'Work' },
  { href: '/#process', label: 'Process' },
  { href: '/#faq', label: 'FAQ' },
] as const;

/** The one label for the contact intent, and where it goes from any page. */
export const CTA = { href: '/#contact', label: 'Start a project' } as const;

export const HERO = {
  eyebrow: 'Digital agency in Pune',
  title: 'Make your business the easy choice online.',
  line: 'Websites, apps and automation for local businesses: gyms, salons, hotels and clinics.',
  secondary: { href: '#work', label: 'See our work' },
} as const;

export const SERVICES_HEAD = {
  title: 'Five things we do well.',
  lead: 'Pick one, or let us put the right mix together for your business.',
} as const;

export const SERVICE_DETAILS: Record<ServiceId, { promise: string; deliverables: readonly string[]; note?: string }> = {
  website: {
    promise: 'A phone-first website that makes people call, book or visit.',
    deliverables: [
      'Designed around your business, not a template',
      'Built for phones first and quick to load',
      'Set up so Google and Maps show the right details',
    ],
  },
  app: {
    promise: 'When ready-made software does not fit how you work, we build what does.',
    deliverables: [
      'Web and mobile apps for your team or your customers',
      'Booking, scheduling, dashboards and internal tools',
      'See SocialSync below, built for a Pune clinic',
    ],
  },
  reviews: {
    promise: 'Make it easy for your real customers to leave a real Google review.',
    deliverables: [
      'A review link or QR code customers get after a visit',
      'Polite reminders so the request is not forgotten',
      "Help turning the customer's own words into a draft they can post",
    ],
    note: 'Real customers, their own words. We never write, buy or filter reviews.',
  },
  'ai-video': {
    promise: 'Short videos and content made for your business and your customers.',
    deliverables: [
      'Promo and explainer videos made with AI tools',
      'Content tailored to a customer, an offer or an occasion',
      'Sized for Instagram, WhatsApp and YouTube',
    ],
  },
  whatsapp: {
    promise: 'Reply, confirm and follow up on WhatsApp without typing the same message twice.',
    deliverables: [
      'Instant replies to common questions',
      'Booking confirmations and reminders',
      'Follow-ups after a visit or an enquiry',
    ],
  },
};

export const PROCESS = {
  title: 'Five steps, no surprises.',
  steps: [
    {
      name: 'Understand',
      text: 'We start with a call or a visit: what you sell, who buys it, and what is not working today.',
    },
    { name: 'Design', text: 'You see the look and the words before we build. Change what you do not like.' },
    { name: 'Build', text: 'We build for phones first and show you progress as it takes shape.' },
    {
      name: 'Launch',
      text: 'We put it live, check it on real devices, and hand over what you need to run it.',
    },
    {
      name: 'Support',
      text: 'After launch we stay reachable for fixes, updates and the next thing you need.',
    },
  ],
} as const;

export const FAQ = {
  title: 'What owners ask us first.',
  items: [
    {
      q: 'How much will it cost?',
      a: 'It depends on what you need. A small website and a custom app are very different jobs. Tell us what you have in mind and we will give you a clear quote before any work starts.',
    },
    {
      q: 'How long will it take?',
      a: 'A simple website is quicker than a custom app. Once we know the scope, the timeline comes with the quote, and we tell you early if anything changes it.',
    },
    {
      q: 'Will it work well on phones?',
      a: 'Yes. Most of your customers will open it on a phone, so we design and test for phones first, then for bigger screens.',
    },
    {
      q: 'I already have a website. Can you improve it?',
      a: 'Yes. We can redesign it, rebuild it, or add what is missing, such as WhatsApp automation or Google review collection.',
    },
    {
      q: 'Are the Google reviews real?',
      a: 'Yes. We only make it easier for your real customers to leave a review in their own words: a link or QR code after their visit, and a reminder. We never write, buy or filter reviews. Google bans that, and so do we.',
    },
    {
      q: 'What do you need from me to start?',
      a: 'A short conversation about your business, your logo and photos if you have them, and the details customers ask for most: services, timings, location and contact numbers. If your content is not ready, tell us and we will work out what is needed together.',
    },
  ],
} as const;

export const FOOTER = {
  privacy: { href: '/privacy', label: 'Privacy' },
  line: '© 2026 Elite Digital Dynamics, Pune.',
} as const;

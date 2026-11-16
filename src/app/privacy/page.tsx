import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'Privacy', alternates: { canonical: '/privacy' } };

const [phone] = site.phones;

/** SPEC.md "Privacy page", word for word. */
const SECTIONS = [
  {
    title: 'What the enquiry form collects.',
    body: 'Your name and phone number, and, if you choose to give them, your email, business name, the service you are interested in and your message.',
  },
  {
    title: 'How it reaches us.',
    body: 'In one of two ways. (1) The form opens WhatsApp or your own email app with your details filled in; nothing leaves your device until you press send there. (2) Where the form sends directly, it uses Web3Forms, a form delivery service, which forwards your message to our email inbox.',
  },
  {
    title: 'What we use it for.',
    body: 'Only to reply to your enquiry and to talk about your project. We do not sell it or pass it to advertisers.',
  },
  {
    title: 'Live previews of client websites.',
    body: 'The "Our work" section loads real client websites inside this page. When a preview loads, your browser connects to that website directly, as if you had opened it, and that website may set its own cookies.',
  },
  {
    title: 'Cookies and tracking.',
    body: 'This website sets no cookies and runs no analytics or advertising trackers. It stores one setting in your browser, whether you paused the background motion, and that setting never leaves your device.',
  },
  {
    title: 'Hosting.',
    body: 'The site is hosted on Vercel. Like any web host, it processes technical data such as your IP address to deliver the pages.',
  },
  {
    title: 'Your choices.',
    body: (
      <>
        To see, correct or delete the details you sent us, email{' '}
        <a className="ui-link" href={site.mailto}>
          {site.email}
        </a>{' '}
        or call{' '}
        <a className="ui-link" href={phone.tel}>
          {phone.display}
        </a>
        .
      </>
    ),
  },
  { title: 'Contact.', body: `${site.name}, ${site.address.full}.` },
];

export default function PrivacyPage() {
  return (
    <main id="main" data-glow="top-right">
      <Container className="pt-[clamp(2rem,6vw,5rem)] pb-(--section-pad)">
        <article className="max-w-text">
          <Heading level={1}>Privacy</Heading>
          <p className="ui-lead mt-6">This page says, in plain words, what this website does with your information.</p>
          {SECTIONS.map(({ title, body }) => (
            <section key={title} className="mt-12">
              <Heading level={2} size="h3">
                {title}
              </Heading>
              <p className="mt-3 text-text-muted">{body}</p>
            </section>
          ))}
          <p className="mt-16 text-small text-text-muted">Last updated: November 2026.</p>
        </article>
      </Container>
    </main>
  );
}

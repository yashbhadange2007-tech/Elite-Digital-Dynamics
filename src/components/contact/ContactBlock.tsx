import { EnvelopeSimple } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { MapPin } from '@phosphor-icons/react/dist/ssr/MapPin';
import { Phone } from '@phosphor-icons/react/dist/ssr/Phone';
import { WhatsappLogo } from '@phosphor-icons/react/dist/ssr/WhatsappLogo';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { site, waLink } from '@/lib/site';

/** Contact block (DESIGN.md 7): a flat list of icon, label and value; 56px rows; WhatsApp as a ghost button. */
export function ContactBlock({ className }: { className?: string }) {
  return (
    <div className={className}>
      <ul className="grid">
        {site.phones.map((phone) => (
          <Row key={phone.e164} icon={<Phone />} label="Call" href={phone.tel}>
            {phone.display}
          </Row>
        ))}
        <Row icon={<EnvelopeSimple />} label="Email" href={site.mailto}>
          {site.email}
        </Row>
        <Row icon={<MapPin />} label="Address">
          <address className="not-italic">{site.address.full}</address>
        </Row>
      </ul>
      <Button href={waLink()} external variant="ghost" icon={<WhatsappLogo />} className="mt-6 max-sm:w-full">
        Chat on WhatsApp
      </Button>
    </div>
  );
}

function Row({ icon, label, href, children }: { icon: ReactNode; label: string; href?: string; children: ReactNode }) {
  const body = (
    <>
      <span aria-hidden="true" className="flex-none text-salmon [&>svg]:size-6">
        {icon}
      </span>
      <span className="grid min-w-0">
        <span className="text-small text-text-muted">{label}</span>
        <span className="text-text [overflow-wrap:anywhere]">{children}</span>
      </span>
    </>
  );
  const row = 'flex min-h-14 items-center gap-4 py-2';
  return (
    <li className="border-b border-hairline last:border-b-0">
      {href ? (
        <a href={href} className={`${row} rounded-card no-underline`}>
          {body}
        </a>
      ) : (
        <div className={row}>{body}</div>
      )}
    </li>
  );
}

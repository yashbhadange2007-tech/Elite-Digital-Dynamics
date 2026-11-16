import { SERVICES } from '@/lib/services';
import { site } from '@/lib/site';

/**
 * Local-business structured data, built only from src/lib/site.ts and src/lib/services.ts.
 * Facts that do not exist (rating, price range, opening hours, geo, founding date, social
 * profiles) are left out on purpose (SPEC.md section 4).
 */
export const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: site.name,
  slogan: site.taglineDisplay,
  url: `${site.siteUrl}/`,
  logo: `${site.siteUrl}/icons/icon-512.png`,
  telephone: site.phones.map((p) => p.display),
  email: site.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    addressLocality: site.address.locality,
    addressRegion: site.address.region,
    addressCountry: site.address.country,
  },
  areaServed: { '@type': 'City', name: site.address.locality },
  makesOffer: SERVICES.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name } })),
};

/** Rendered once by the root layout. "<" is escaped so the JSON can never close the script tag. */
export default function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
    />
  );
}

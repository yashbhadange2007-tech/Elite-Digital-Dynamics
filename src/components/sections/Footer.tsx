import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { MotionToggle } from '@/components/ui/MotionToggle';

/**
 * STUB (foundation). Agent C replaces this with the real footer (DESIGN.md 7, SPEC.md):
 * stacked lockup, link and contact columns, bottom row.
 * Default export, rendered by the root layout on every page, so links are `/#id`.
 */
const LINKS = [
  { href: '/#services', label: 'Services' },
  { href: '/#work', label: 'Work' },
  { href: '/#process', label: 'Process' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/#contact', label: 'Start a project' },
  { href: '/privacy', label: 'Privacy' },
];

export default function Footer() {
  return (
    <footer className="border-t border-hairline">
      <Container className="flex flex-col gap-8 py-12">
        <div>
          <Logo variant="stacked" loading="lazy" className="h-[120px] w-auto md:h-[150px]" />
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="ui-pill-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-small text-text-muted">© 2026 Elite Digital Dynamics, Pune.</p>
          <MotionToggle />
        </div>
      </Container>
    </footer>
  );
}

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';

/**
 * STUB (foundation). Agent C replaces this with the real navigation (DESIGN.md 7, SPEC.md):
 * glass pill after 24px of scroll, current-section state, phone menu.
 * Default export, rendered by the root layout on every page, so links are `/#id`.
 */
const LINKS = [
  { href: '/#services', label: 'Services' },
  { href: '/#work', label: 'Work' },
  { href: '/#process', label: 'Process' },
  { href: '/#faq', label: 'FAQ' },
];

export default function Nav() {
  return (
    <header className="sticky top-0">
      <Container className="flex min-h-(--nav-h) items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center">
          {/* `lazy` on both: the one hidden by CSS is then never downloaded. */}
          <Logo variant="horizontal" decorative loading="lazy" className="hidden lg:block" />
          <Logo variant="mark" decorative loading="lazy" className="lg:hidden" />
          <VisuallyHidden>Elite Digital Dynamics, home</VisuallyHidden>
        </Link>
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="ui-pill-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Button href="/#contact">Start a project</Button>
      </Container>
    </header>
  );
}

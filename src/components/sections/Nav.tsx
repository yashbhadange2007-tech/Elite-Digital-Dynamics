'use client';

import { List } from '@phosphor-icons/react/dist/ssr/List';
import { Phone } from '@phosphor-icons/react/dist/ssr/Phone';
import { WhatsappLogo } from '@phosphor-icons/react/dist/ssr/WhatsappLogo';
import { X } from '@phosphor-icons/react/dist/ssr/X';
import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { cn } from '@/lib/cn';
import { scrollState, subscribeScroll } from '@/lib/scroll-store';
import { site, waLink } from '@/lib/site';
import { CTA, NAV_LINKS } from './content';

const MENU_ID = 'site-menu';

/**
 * Site navigation (DESIGN.md 7, SPEC.md). Rendered by the root layout on every page.
 * Transparent at the top; after 24px of scroll the links and the button sit in one glass pill.
 * Below 1024px the links move into a native popover sheet: the browser gives it Escape, outside
 * tap and the button's expanded state. Where popover is not supported the menu button is not
 * shown (the page still scrolls to every section and the footer repeats the links).
 */
export default function Nav() {
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => scrollState.y > 24,
    () => false,
  );
  const [open, setOpen] = useState(false);
  // Same box in both states, so nothing moves when the glass appears. Without blur the fill is
  // opaque: at the 0.86 of lite glass the page text shows through behind the links.
  const pill = (blurs: boolean) =>
    cn(
      'rounded-pill border p-1 transition-colors duration-1',
      scrolled ? 'ui-glass border-hairline-strong' : 'border-transparent',
      scrolled && (blurs ? 'in-data-[glass=lite]:bg-ember-950' : 'bg-ember-950'),
    );

  return (
    <header className="sticky top-0">
      <Container className="flex min-h-(--nav-h) items-center justify-between gap-2">
        {/* The logo gets its own capsule (never blurred), so it stays readable over the page text. */}
        <Link href="/" className={cn(pill(false), '-ml-1 inline-flex items-center lg:-ml-3 lg:px-3')}>
          {/* `lazy` on both: the one hidden by CSS is then never downloaded. */}
          <Logo variant="horizontal" height={40} decorative loading="lazy" className="hidden lg:block" />
          <Logo variant="mark" decorative loading="lazy" className="lg:hidden" />
          <VisuallyHidden>Elite Digital Dynamics, home</VisuallyHidden>
        </Link>

        <nav
          aria-label="Primary"
          data-primary={scrolled ? '' : undefined}
          className={cn(pill(true), 'flex items-center gap-2')}
        >
          <ul className="hidden items-center gap-2 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="ui-pill-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Button href={CTA.href}>{CTA.label}</Button>

          <button
            type="button"
            popoverTarget={MENU_ID}
            className="ui-pill-link hidden w-11 justify-center px-0 text-text max-lg:supports-[selector(:popover-open)]:inline-flex"
          >
            {open ? <X aria-hidden="true" /> : <List aria-hidden="true" />}
            <VisuallyHidden>{open ? 'Close menu' : 'Menu'}</VisuallyHidden>
          </button>
          <div
            id={MENU_ID}
            popover="auto"
            className="ui-glass fixed inset-auto inset-x-(--page-gutter) top-(--nav-h) m-0 hidden max-h-[calc(100dvh-var(--nav-h)-1rem)] w-auto overflow-auto bg-ember-950 p-2 text-text open:block lg:hidden!"
            onToggle={(event) => {
              const isOpen = event.newState === 'open';
              setOpen(isOpen);
              if (isOpen) event.currentTarget.querySelector('a')?.focus();
            }}
            onClick={(event) => {
              if ((event.target as Element).closest('a')) event.currentTarget.hidePopover();
            }}
          >
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.href} className="border-b border-hairline py-1">
                  <Link
                    href={link.href}
                    className="flex min-h-12 items-center rounded-card px-4 text-lead font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-2 pt-3 pb-1">
              <Button href={site.phones[0].tel} variant="ghost" icon={<Phone />}>
                Call
              </Button>
              <Button href={waLink()} variant="ghost" external icon={<WhatsappLogo />}>
                WhatsApp
              </Button>
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}

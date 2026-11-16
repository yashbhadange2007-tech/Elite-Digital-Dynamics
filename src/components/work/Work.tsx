'use client';

import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr/ArrowUpRight';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DeviceFrame } from '@/components/ui/DeviceFrame';
import { Heading } from '@/components/ui/Heading';
import { Section } from '@/components/ui/Section';
import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/lib/hooks';
import { SitePreview, type SitePreviewProps } from './SitePreview';
import { SITES } from './sites.config';

export type WorkProps = {
  /** Preview route only: point the first site's frames at a stub page in a chosen mode. */
  stub?: Pick<SitePreviewProps, 'url' | 'mode' | 'height'>;
};

/**
 * "Our work": three live client sites in device frames (DESIGN.md 8).
 * Below 1024px: a segmented control and one phone frame for the selected site; the other cards are
 * hidden and their previews are not rendered, so only the selected site can mount an iframe.
 * From 1024px: laptop frame for the first site, phone frames for the other two, bottoms aligned.
 * (Server render and hydration use the phone layout's previews; the CSS layout is right from the start.)
 */
export default function Work({ stub }: WorkProps) {
  const [selected, setSelected] = useState(SITES[0].slug);
  const wide = useMediaQuery('(min-width: 64rem)');

  return (
    <Section id="work" pose="work" title="Work you can open right now." lead="Three live client websites. Browse each one here, or open the full site.">
      <fieldset className="mb-6 min-w-0 lg:hidden">
        <legend className="visually-hidden">Choose a site to preview</legend>
        <div className="-m-1.5 flex gap-2 overflow-x-auto p-1.5 [scrollbar-width:none]">
          {SITES.map((site) => (
            <label
              key={site.slug}
              className="flex min-h-11 flex-none cursor-pointer items-center rounded-pill border border-hairline-strong px-5 text-small font-medium whitespace-nowrap text-text-muted transition-colors duration-1 has-checked:border-ember-600 has-checked:bg-ember-600 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-focus"
            >
              <input
                type="radio"
                name="work-site"
                value={site.slug}
                checked={selected === site.slug}
                onChange={() => setSelected(site.slug)}
                className="sr-only"
              />
              {site.name}
            </label>
          ))}
        </div>
      </fieldset>

      <ul className="lg:grid lg:grid-cols-[minmax(0,58fr)_minmax(0,21fr)_minmax(0,21fr)] lg:gap-x-8">
        {SITES.map((site, index) => {
          const preview = index === 0 ? stub : undefined;
          const chosen = site.slug === selected;
          return (
            <li
              key={site.slug}
              className={cn(
                'mx-auto max-w-[20.5rem] lg:row-span-4 lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1fr)] lg:grid-rows-subgrid',
                !chosen && 'max-lg:hidden',
              )}
            >
              {index === 0 ? (
                <>
                  <DeviceFrame variant="phone" addressLabel={site.addressLabel} className="lg:hidden">
                    {!wide && chosen ? <SitePreview site={site} device="phone" {...preview} /> : null}
                  </DeviceFrame>
                  <DeviceFrame variant="laptop" addressLabel={site.addressLabel} className="self-end max-lg:hidden">
                    {wide ? <SitePreview site={site} device="laptop" {...preview} /> : null}
                  </DeviceFrame>
                </>
              ) : (
                <DeviceFrame variant="phone" addressLabel={site.addressLabel} className="self-end">
                  {wide || chosen ? <SitePreview site={site} device="phone" /> : null}
                </DeviceFrame>
              )}
              <Heading level={3} className="mt-5">
                {site.name}
              </Heading>
              <p className="mt-2 text-text-muted">{site.caption}</p>
              <div className="mt-4">
                <Button href={`/visit/${site.slug}`} external variant="ghost" icon={<ArrowUpRight />}>
                  Open live site
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { useInView } from '@/lib/hooks';
import type { Device, Mode, Site } from './sites.config';

const VIRTUAL_WIDTH: Record<Device, number> = { phone: 390, laptop: 1280 };
const GIVE_UP_MS = 8000;

export type SitePreviewProps = {
  site: Site;
  device: Device;
  /** Overrides for the preview route's stub pages. Default: the site's own values. */
  url?: string;
  mode?: Mode;
  height?: number;
};

/**
 * The screen content of one device frame (docs/ARCHITECTURE.md 4). Fills the frame's screen box.
 * The first screenshot tile is the skeleton under the iframe until `load`; if the iframe has not
 * loaded after 8 s, or the site cannot be reached, the full screenshot replaces it for good.
 * The iframe mounts only once the frame is within 600px of the viewport.
 */
export function SitePreview({ site, device, url = site.url, mode = site.mode[device], height = site.height[device] }: SitePreviewProps) {
  const box = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const near = useInView(box, { rootMargin: '600px 0px', once: true });
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const [scale, setScale] = useState(0);
  const virtual = VIRTUAL_WIDTH[device];
  const framed = mode !== 'screenshot' && state !== 'failed';
  const live = framed && near && scale > 0;

  // Scale factor from the virtual width to the width our content box really has.
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / virtual));
    observer.observe(content.current!);
    return () => observer.disconnect();
  }, [virtual]);

  useEffect(() => {
    if (!near || mode === 'screenshot') return;
    const timer = setTimeout(() => setState((s) => (s === 'loaded' ? s : 'failed')), GIVE_UP_MS);
    // A failed iframe still fires `load` (on the browser's error page), so ask the network too.
    const abort = new AbortController();
    fetch(url, { method: 'HEAD', mode: 'no-cors', signal: abort.signal }).catch(() => {
      if (!abort.signal.aborted) setState('failed');
    });
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [near, mode, url]);

  const tiles = site.shots[device];
  const shown = !framed ? tiles : state === 'loaded' ? [] : tiles.slice(0, 1);
  // Our scroller owns scroll and click in every mode but a working interactive frame.
  const ours = !framed || mode === 'tall';
  const frameProps = {
    src: url,
    title: `${site.name} website`,
    sandbox: 'allow-scripts allow-same-origin',
    referrerPolicy: 'strict-origin-when-cross-origin' as const,
    onLoad: () => setState((s) => (s === 'failed' ? s : 'loaded')),
    className: 'absolute top-0 left-0 origin-top-left border-0',
  };

  return (
    <div ref={box} className="relative h-full min-h-0">
      <div
        role={ours ? 'region' : undefined}
        aria-label={ours ? `${site.name} website preview` : undefined}
        tabIndex={ours ? 0 : undefined}
        className={ours ? 'h-full overflow-y-auto overscroll-auto touch-pan-y [scrollbar-width:thin]' : 'h-full overflow-hidden'}
      >
        <div
          ref={content}
          className="relative overflow-hidden"
          style={framed && mode === 'tall' ? { height: height * 1.02 * scale, backgroundColor: site.footerColor } : undefined}
        >
          {shown.map((shot) => (
            // eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP tiles, no optimiser needed
            <img key={shot.src} src={shot.src} width={shot.width} height={shot.height} alt="" loading="lazy" decoding="async" className="block h-auto w-full" />
          ))}
          {live && mode === 'tall' ? (
            <iframe
              {...frameProps}
              inert
              tabIndex={-1}
              className={`${frameProps.className} pointer-events-none`}
              style={{ width: virtual, height, transform: `scale(${scale})` }}
            />
          ) : null}
          {ours ? (
            // The tap target over the page. Hidden from assistive tech: "Open live site" is the accessible link.
            <ExternalLink href={`/visit/${site.slug}`} aria-hidden="true" tabIndex={-1} draggable={false} className="absolute inset-0">
              {null}
            </ExternalLink>
          ) : null}
        </div>
      </div>
      {live && mode === 'interactive' ? (
        <iframe {...frameProps} style={{ width: virtual, height: `${100 / scale}%`, transform: `scale(${scale})` }} />
      ) : null}
    </div>
  );
}

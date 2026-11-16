import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { FAQ } from './content';

/**
 * FAQ (DESIGN.md 7 and 8, SPEC.md): six native <details> sharing one name, so the browser keeps
 * one open at a time and handles Enter and Space. One lite glass panel; from 1024px the h2 stays
 * sticky in a left column. The question is plain text in the summary, not a heading: screen
 * readers expose a summary as a button and drop a heading inside it.
 */
export default function Faq() {
  return (
    <Section
      id="faq"
      pose="faq"
      title={FAQ.title}
      containerClassName="lg:grid lg:grid-cols-12 lg:gap-x-8"
      headerClassName="lg:sticky lg:top-[calc(var(--nav-h)+2rem)] lg:col-span-4 lg:mb-0 lg:self-start"
    >
      <Reveal className="lg:col-span-8">
        <GlassPanel className="py-2 lg:py-4">
          {FAQ.items.map((item, index) => (
            <details
              key={item.q}
              name="faq"
              open={index === 0}
              className="group border-b border-hairline py-1 last:border-b-0"
            >
              {/* 56px target with 4px above and below: a 64px row and 8px between neighbouring targets. */}
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-4 rounded-card py-3 text-h3 [&::-webkit-details-marker]:hidden">
                <Plus
                  aria-hidden="true"
                  className="size-5 flex-none text-salmon duration-2 ease-out group-open:rotate-45 motion-full:transition-transform"
                />
                {item.q}
              </summary>
              <p className="max-w-[58ch] pb-6 pl-9 text-text-muted">{item.a}</p>
            </details>
          ))}
        </GlassPanel>
      </Reveal>
    </Section>
  );
}

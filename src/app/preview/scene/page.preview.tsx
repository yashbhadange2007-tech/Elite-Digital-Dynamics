import SceneLayer from '@/components/scene/SceneLayer';
import { POSE_ORDER } from '@/lib/scroll-store';

/**
 * Preview route for the scene: /preview/scene (development only, never built for production).
 * Seven tall stand-in sections, one per pose, and a stand-in logo stage, so the scroll
 * choreography can be checked without the real sections.
 * Switches: ?pose=<id>  ?tier=<1-3>  ?still=1  ?hud=1  ?scene=force (see SceneLayer).
 */
export default function ScenePreview() {
  return (
    <>
      <SceneLayer />
      <main id="main">
        <h1 className="visually-hidden">Preview: scene</h1>
        {POSE_ORDER.map((pose) =>
          pose === 'contact' ? (
            <section key={pose} className="flex min-h-[110svh] flex-col items-center gap-4 px-(--page-gutter) pt-[30svh]">
              <div
                data-logo-stage
                data-pose="contact"
                className="size-[168px] outline-1 outline-hairline lg:size-[220px]"
              />
              <p className="text-small text-text-muted">contact: the logo stage</p>
            </section>
          ) : (
            <section key={pose} data-pose={pose} className="min-h-[130svh] px-(--page-gutter) pt-[calc(var(--nav-h)+2rem)]">
              <p className="text-small text-text-muted">{pose}</p>
            </section>
          ),
        )}
      </main>
    </>
  );
}

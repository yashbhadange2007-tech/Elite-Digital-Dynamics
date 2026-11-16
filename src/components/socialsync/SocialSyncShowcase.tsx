import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { DemoLoader } from './DemoLoader';
import styles from './socialsync.module.css';

/** "Our work: SocialSync demo" section (SPEC.md). The demo itself loads late (DemoLoader). */
export default function SocialSyncShowcase() {
  return (
    <section id="demo" data-pose="demo" aria-labelledby="demo-title" className="ui-section">
      <Container className={styles.layout}>
        <div className={styles.intro}>
          <Eyebrow>App we built</Eyebrow>
          <Heading level={2} id="demo-title">
            SocialSync: one post, three platforms.
          </Heading>
          <p className="ui-lead">
            A scheduling app we built for IPMH, a physiotherapy and osteopathy clinic in Pune. The team writes one
            post and publishes it to Instagram, a Facebook Page and YouTube together, now or at a set time in India
            time, then sees how each post performed.
          </p>
          <p className={styles.second}>
            The real app is private, so this is a working demo with sample data. Watch it run, or take over and click
            through.
          </p>
          <p className={styles.credit}>Built for IPMH, Pune</p>
        </div>
        <DemoLoader />
      </Container>
    </section>
  );
}

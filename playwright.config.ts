import { defineConfig } from '@playwright/test';

/**
 * No `webServer`: tests run against the server that is already up (the shared dev server on 3000, or
 * `BASE_URL=http://localhost:<port>` for a production build).
 *
 * Evidence screenshots are tracked in git under tests/evidence/. Save them explicitly:
 *   await page.screenshot({ path: testInfo.snapshotPath('hero.png') });
 *   -> tests/evidence/<spec file name>/hero-<project>.png
 * Failure artefacts (untracked) go to test-results/<run>/, see RUN below.
 */

// No GPU in CI or in the build container: software WebGL through ANGLE + SwiftShader.
export const WEBGL_ARGS = [
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

// Playwright empties its output folder when a run starts. Several agents run their own spec at the
// same time, so each run gets its own folder, named after the spec file given on the command line.
// The env var keeps the main process and its workers on the same value.
process.env.EDD_PW_RUN ??= process.argv.map((arg) => /(\w+)\.spec\.ts/.exec(arg)?.[1]).find(Boolean) ?? 'all';
const RUN = process.env.EDD_PW_RUN;

export default defineConfig({
  testDir: 'tests',
  outputDir: `test-results/${RUN}`,
  snapshotPathTemplate: '{testDir}/evidence/{testFileName}/{arg}-{projectName}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: 2,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    browserName: 'chromium',
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure',
    navigationTimeout: 30_000,
    launchOptions: { args: WEBGL_ARGS },
  },
  projects: [
    {
      name: 'phone',
      use: { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
    },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
});

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Unit tests: pure logic only, colocated as src/**\/*.test.ts(x), run in Node (no DOM).
 * Browser behaviour is tested with Playwright in tests/*.spec.ts (see playwright.config.ts).
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});

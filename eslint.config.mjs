import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Defaults of eslint-config-next
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Not our code: installed skills ship their own scripts
    '.claude/**',
    '.agents/**',
    // Test output
    'test-results/**',
    'playwright-report/**',
    'tests/evidence/**',
  ]),
]);

export default eslintConfig;

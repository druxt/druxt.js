import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

// Async factory, not top-level await: this .ts config loads as CommonJS (no "type": "module").
export default defineConfig(async () => ({
  test: {
    projects: [
      { test: { name: 'unit', include: ['test/unit/*.test.ts'] } },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.test.ts'],
          environment: 'nuxt',
          environmentOptions: {
            nuxt: {
              rootDir: fileURLToPath(new URL('./test/nuxt/app', import.meta.url)),
              // import.meta.dev otherwise reads false in this environment.
              overrides: { dev: true },
            },
          },
          setupFiles: ['test/nuxt/setup.ts'],
        },
      }),
      {
        test: {
          name: 'standalone',
          include: ['test/standalone/*.test.ts'],
          // Each file builds a Nuxt app; one at a time keeps memory and ports in hand.
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 300_000,
        },
      },
      {
        test: {
          name: 'docs',
          include: ['test/docs/**/*.test.ts'],
          environment: 'node',
          // TypeDoc renders all four packages in one run.
          testTimeout: 300_000,
          hookTimeout: 300_000,
        },
      },
    ],
  },
}))

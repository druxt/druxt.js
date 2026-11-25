import { defineConfig } from 'vitest/config'

// The nuxt project returns with the test harness and its component tests' app, test/nuxt/app.
export default defineConfig({
  test: {
    projects: [
      { test: { name: 'unit', include: ['test/unit/*.test.ts'] } },
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
})

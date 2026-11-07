import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

// Nuxt's own config, as a Nuxt module repository uses it. Formatting is
// prettier's, so the stylistic rules stay off.
export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: false,
  },
}).append(
  {
    ignores: [
      // 1.x packages not yet ported: each leaves this list in its port's merge request.
      'packages/blocks/**',
      'packages/breadcrumb/**',
      'packages/docgen/**',
      'packages/druxt/**',
      'packages/entity/**',
      'packages/menu/**',
      'packages/router/**',
      'packages/schema/**',
      'packages/site/**',
      'packages/views/**',
      'test/mixins.test.js',
      'test/standalone/backend.ts',
      'test/standalone/standalone.ts',
      'test/unit/runtime-imports.test.ts',
      // 1.x examples and tooling, run on the 1.x line.
      'examples/**',
      'test/__fixtures__/**',
      'scripts/**',
      '.agents/**',
      'perf/**',
      'coverage/**',
    ],
  },
  {
    rules: {
      // The JSDoc is the API reference: every param says what it is.
      'jsdoc/require-param-description': 'error',
      // A destructured option's fields are typed by the signature.
      'jsdoc/check-param-names': ['error', { checkDestructured: false }],
      // Druxt's caches are records keyed by data, emptied key by key, as 1.x's were.
      '@typescript-eslint/no-dynamic-delete': 'off',
    },
  },
)

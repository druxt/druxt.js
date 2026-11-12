import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

/**
 * A server render must hold the resolved wrapper, not the placeholder
 * comment useDruxtModule() renders before its pipeline has any data.
 * Nothing is fetched here: the fixture needs no Drupal.
 */
describe('useDruxtModule(), server rendered', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/ssr', import.meta.url)),
    build: true,
    server: true,
    setupTimeout: 300_000,
  })

  it('renders the resolved wrapper, not the "no payload yet" comment', async () => {
    const html = await $fetch<string>('/')
    expect(html).toContain('Rendered on the server')
    expect(html).not.toContain('<!--druxt-->')
  })

  it('carries the resolved wrapper in the payload, under the module\'s own key', async () => {
    const html = await $fetch<string>('/')
    // The precondition for hydration fetching nothing: the key useId() gave
    // the module, and the wrapper the pipeline resolved for it, both in the
    // server-sent payload.
    expect(html).toContain('druxt:DruxtSsr:')
    expect(html).toContain('DruxtSsrDefault')
  })
})

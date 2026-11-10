import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

/**
 * Builds and serves a real Nuxt 4 app that lists one Druxt module alone, and
 * asserts a server render holds Drupal's content. Nothing of Nuxt is stubbed,
 * so the module's setup runs as a site would run it.
 *
 * @param name - The module, as in `@druxt/<name>`, and its fixture directory.
 * @param path - The path to render.
 * @param expected - Text the rendered page must contain.
 * @param more - Extra checks, registered inside the same built app.
 */
export const standalone = (name: string, path: string, expected: string[], more?: () => void) => {
  describe(`@druxt/${name}, installed alone`, async () => {
    await setup({
      rootDir: fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)),
      build: true,
      server: true,
      setupTimeout: 300_000,
    })

    it(`renders ${path}`, async () => {
      const html = await $fetch<string>(path)
      for (const text of expected) expect(html).toContain(text)
    })

    more?.()
  })
}

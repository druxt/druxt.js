import { vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { useNuxtApp, useRouter } from '#imports'

/**
 * Waits for the module's async pipeline, and any lazily-registered global
 * component's async loader, to settle before an assertion reads the render.
 * With a predicate, waits for it to pass (via `vi.waitFor`) instead of
 * running a fixed number of ticks.
 *
 * The "Your Vite config uses features that are unsupported by
 * `configLoader: 'native'`" warning this suite prints at the start of a run
 * comes from vitest.config.ts's own async factory (loaded as CommonJS); it
 * is harmless.
 */
export const settle = async (until?: () => unknown) => {
  if (until) {
    await vi.waitFor(until)
    return
  }
  for (let i = 0; i < 10; i++) {
    await flushPromises()
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }
}

/**
 * The keys of the payload's data that hold a value. Nuxt 4.4 clears an unused
 * entry to `undefined` and keeps its key, where 4.5 deletes it, so a cleared
 * entry is left out on either.
 */
export const payloadKeys = (): string[] => Object.entries(useNuxtApp().payload.data)
  .filter(([, value]) => value !== undefined)
  .map(([key]) => key)

/**
 * Gives the test app's router a catch-all route, once, so a test can navigate
 * to any path. The app has no pages, and from Nuxt 4.6 a navigation that
 * matches no route leaves the current route as it was.
 */
export const matchAnyPath = (): void => {
  const router = useRouter()
  if (!router.hasRoute('druxt-test-any')) router.addRoute({ name: 'druxt-test-any', path: '/:path(.*)*', component: { render: () => null } })
}

/**
 * Markup without Druxt's anchors, the `data-druxt-*` attributes development writes by default, for a test of other
 * output. No module writes them yet: the core port brings them with @druxt/core, and test/nuxt/anchors.test.ts,
 * which tests the anchors themselves.
 *
 * @param html - The markup.
 */
export const withoutAnchors = (html: string): string => html.replace(/ data-druxt-(?:entity|type|langcode|field|delta)="[^"]*"/g, '')

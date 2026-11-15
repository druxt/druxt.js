import anchors from '#build/druxt/anchors.mjs'
import type { DruxtAnchorsState } from '@druxt/core/anchors'

/**
 * Whether Druxt's default output carries its anchors, the `data-druxt-*` attributes that name entities and fields, and
 * the modules that required them. Settled at build, so the server and the browser agree. A module that needs anchors
 * reads it to tell its users when the site turned them off, rather than failing silently.
 *
 * @returns The anchors state: `enabled`, `requiredBy`, and `disabledBy: 'site'` when the site's `druxt.anchors: false`
 *   overruled a module that required them.
 *
 * @example @lang vue
 * <script setup lang="ts">
 * const { enabled } = useDruxtAnchors()
 * </script>
 *
 * <template>
 *   <p v-if="!enabled">Front-end editing is off because this site disabled Druxt anchors.</p>
 * </template>
 */
export const useDruxtAnchors = (): Readonly<DruxtAnchorsState> => anchors

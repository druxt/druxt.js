import anchors from '#build/druxt/anchors.mjs'
import type { DruxtAnchorsState } from '@druxt/core/anchors'

/**
 * Gets whether Druxt's default output carries its anchors, and the modules that required them.
 *
 * The anchors are the `data-druxt-*` attributes that name entities and fields. Their state is settled at build, so
 * the server and the browser agree.
 *
 * A module that needs anchors reads this to tell its users when the site turned them off, and does not fail
 * silently.
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

import { computed, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { editPermission } from '@druxt/core/edit'
import type { DruxtEditPermission } from '@druxt/core/edit'
import { useNuxtApp } from '#imports'
import type { DruxtEditingSettings } from './edit-store'
import { useDruxtSettings } from './settings'

/** What `useDruxtEditing()` reads of an entity: its links, when a module adds them. */
export interface DruxtEditingTarget {
  /** The entity's JSON:API links, such as an `update` relation JSON:API Hypermedia adds. */
  links?: Record<string, unknown> | null
}

/** What `useDruxtEditing()` returns. */
export interface DruxtEditing {
  /** Whether the site offers editing, from `druxt.editing.enabled`. */
  enabled: ComputedRef<boolean>
  /** Whether a user is signed in through the browser's client. A write then carries a token. */
  signedIn: ComputedRef<boolean>
  /** Whether the current session may edit the entity: `allowed`, `denied`, or `unknown` when there is no signal. */
  permission: ComputedRef<DruxtEditPermission>
}

/**
 * Whether the current session can edit, for an editor's controls: an edit button, an overlay, a toolbar.
 *
 * The permission is one of three:
 *
 * - `denied` when editing is turned off with `druxt.editing.enabled: false`, or when no user is signed in through
 *   the browser's client.
 * - `allowed` when the entity's links carry an update relation. A module such as JSON:API Hypermedia provides one,
 *   and Drupal emits it only for a user who may update the entity.
 * - `unknown` without such a signal. An editor then offers the edit, tries the save, and reports Drupal's answer.
 *
 * The core store keeps no links, so the entity's links come from the editor that read them.
 *
 * @param target - The entity's links, if known, as a value, ref or getter.
 * @returns Whether editing is on, whether a user is signed in, and the permission.
 *
 * @example @lang vue
 * <script setup lang="ts">
 * const { permission } = useDruxtEditing()
 * </script>
 *
 * <template>
 *   <button v-if="permission !== 'denied'" type="button">Edit</button>
 * </template>
 */
export const useDruxtEditing = (target?: MaybeRefOrGetter<DruxtEditingTarget | undefined>): DruxtEditing => {
  const nuxtApp = useNuxtApp()
  const settings = useDruxtSettings()
  const enabled = computed(() => (settings.editing as DruxtEditingSettings | undefined)?.enabled !== false)
  // This is reactive because the client's cookie storage reads refs.
  const signedIn = computed(() => !!nuxtApp.$druxt?.auth?.loggedIn)
  const permission = computed(() => editPermission({ enabled: enabled.value, signedIn: signedIn.value, links: toValue(target)?.links }))
  return { enabled, signedIn, permission }
}

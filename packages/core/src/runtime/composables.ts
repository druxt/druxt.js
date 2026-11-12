import type { DruxtClient } from '@druxt/client'
import { useNuxtApp } from '#imports'

/** The Druxt client, as `$druxt` is on a component. */
export const useDruxtClient = (): DruxtClient => useNuxtApp().$druxt

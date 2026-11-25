import type { DruxtClient } from '@druxt/client'
import { useNuxtApp } from '#imports'

/** Gets the Druxt client. It is the same client as `$druxt` on a component. */
export const useDruxtClient = (): DruxtClient => useNuxtApp().$druxt

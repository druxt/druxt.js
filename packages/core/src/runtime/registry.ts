import type { StoreDefinition } from 'pinia'
import { useDruxtStore } from './store'

/** A store definition of any id, state, getters and actions: Pinia's own defaults for the four. */
type AnyStoreDefinition = StoreDefinition

// Store definitions by their 1.x Vuex namespace. Definitions, not instances, so one registry serves every request.
const registry: Record<string, AnyStoreDefinition> = { druxt: useDruxtStore }

/**
 * Registers a module's Pinia store under its 1.x Vuex namespace, for @druxt/compat's `$store`.
 *
 * @param namespace - The Vuex namespace, such as `druxtMenu` or `druxt/views`.
 * @param useStore - The Pinia store definition.
 */
export const registerDruxtStore = (namespace: string, useStore: AnyStoreDefinition): void => {
  registry[namespace] = useStore
}

/** The registered store definitions, by namespace. */
export const getDruxtStores = (): Readonly<Record<string, AnyStoreDefinition>> => registry

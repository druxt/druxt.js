import { describe, expect, it, vi } from 'vitest'
import { createStorage } from 'unstorage'
import { drupalSettingsStorageKey } from '../../packages/core/src/runtime/utils/drupal-settings'

const runtime = vi.hoisted(() => ({ storage: undefined as unknown, defaults: {} as Record<string, unknown> }))
vi.mock('nitropack/runtime', () => ({ useStorage: () => runtime.storage }))
// The modules' defaults, written into the build.
vi.mock('#druxt/defaults', () => ({ default: runtime.defaults }))
vi.mock('#imports', () => ({ useRuntimeConfig: () => ({}) }))

describe('druxtSettingsFrom()', () => {
  it('resolves the stored tiers and then the config, without a request, and leaves out the client options', async () => {
    const storage = createStorage()
    runtime.storage = storage
    await storage.setItem(drupalSettingsStorageKey('default'), {
      public: { schema: { filter: ['from-public'], refresh: false } },
      server: { schema: { filter: ['from-server'] } },
    })
    const { druxtSettingsFrom } = await import('../../packages/core/src/runtime/server/settings')
    const settings = await druxtSettingsFrom({ public: { druxt: { baseUrl: 'https://drupal.test', siteUrl: 'https://site.test', schema: { refresh: true } } } })
    expect(settings.siteUrl).toBe('https://site.test')
    expect(settings.schema).toEqual({ filter: ['from-server'], refresh: true })
    expect(settings).not.toHaveProperty('baseUrl')
  })

  it('resolves the modules\' defaults below the stored tiers and the config, so Drupal can turn a default off', async () => {
    const storage = createStorage()
    runtime.storage = storage
    Object.assign(runtime.defaults, { schema: { refresh: true, filter: [] }, entity: { label: true, query: {} } })
    await storage.setItem(drupalSettingsStorageKey('default'), { public: { schema: { refresh: false }, entity: { label: false } } })
    const { druxtSettingsFrom } = await import('../../packages/core/src/runtime/server/settings')
    const settings = await druxtSettingsFrom({ public: { druxt: { entity: { query: { include: ['uid'] } } } } })
    expect(settings.schema).toEqual({ refresh: false, filter: [] })
    expect(settings.entity).toEqual({ label: false, query: { include: ['uid'] } })
    const fromConfig = await druxtSettingsFrom({ public: { druxt: { entity: { label: true } } } })
    expect(fromConfig.entity).toEqual({ label: true, query: {} })
    for (const key of Object.keys(runtime.defaults)) delete runtime.defaults[key]
  })
})

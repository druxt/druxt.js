import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNuxtApp, useRuntimeConfig, useState } from '#imports'
import { DRUXT_SETTINGS_DRUPAL_KEY, setDrupalSettings, useDruxtSettings } from '@druxt/core/settings'
import { DRUXT_CLIENT_KEYS } from '@druxt/client'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { computed, defineComponent, h, nextTick } from 'vue'

const fromDrupal = () => useState<Record<string, unknown>>(DRUXT_SETTINGS_DRUPAL_KEY('default'))
const config = () => useRuntimeConfig().public.druxt as Record<string, unknown>

describe('useDruxtSettings()', () => {
  // What the settings' logger writes, which reaches the console or stderr depending on its reporter.
  let output: string[] = []
  const spies: Array<{ mockRestore: () => void }> = []
  beforeEach(() => {
    output = []
    const record = (...args: unknown[]) => { output.push(args.map(String).join(' ')) }
    spies.push(vi.spyOn(console, 'warn').mockImplementation(record), vi.spyOn(console, 'log').mockImplementation(record))
    const write = process.stderr.write.bind(process.stderr)
    spies.push(vi.spyOn(process.stderr, 'write').mockImplementation((chunk: string | Uint8Array, ...rest: unknown[]) => {
      record(String(chunk))
      return write(chunk, ...(rest as []))
    }))
  })
  afterEach(() => {
    for (const spy of spies.splice(0)) spy.mockRestore()
    fromDrupal().value = {}
    delete config().testUnset
    delete config().testConfig
  })

  it('does not let a config key left undefined erase a Drupal value', () => {
    config().testUnset = undefined
    config().testConfig = 'config'
    fromDrupal().value = { testUnset: 'drupal', testConfig: 'drupal' }
    expect(useDruxtSettings()).toMatchObject({ testUnset: 'drupal', testConfig: 'config' })
  })

  it('holds no client option and no credential, from the config or from Drupal', () => {
    fromDrupal().value = { baseUrl: 'https://elsewhere.test', proxy: { api: true }, auth: { clientId: 'x' }, build: {} }
    const keys = Object.keys(useDruxtSettings())
    for (const key of [...DRUXT_CLIENT_KEYS, 'build', 'connections']) expect(keys).not.toContain(key)
  })

  it('gives one read-only view per app, which reads a tier set after it was taken', () => {
    const settings = useDruxtSettings()
    expect(useDruxtSettings()).toBe(settings)
    setDrupalSettings('default', { public: { replaced: true } })
    expect(settings.replaced).toBe(true)
    expect(Reflect.set(settings, 'replaced', false)).toBe(false)
    expect(settings.replaced).toBe(true)
  })

  // A nested value is shared: a module's default is one object for every request the server answers.
  it('refuses a write below the top level, through a read or a descriptor', () => {
    setDrupalSettings('default', { public: { nested: { list: ['a', 'b'], deep: { on: true } } } })
    const settings = useDruxtSettings() as unknown as { nested: { list: string[], deep: { on: boolean } } }
    expect(() => settings.nested.list.reverse()).toThrow(TypeError)
    expect(() => { settings.nested.deep.on = false }).toThrow(TypeError)
    expect(Reflect.deleteProperty(settings.nested, 'deep')).toBe(false)
    const described = Object.getOwnPropertyDescriptor(settings, 'nested')!.value as typeof settings.nested
    expect(() => described.list.push('c')).toThrow(TypeError)
    expect(settings.nested).toEqual({ list: ['a', 'b'], deep: { on: true } })
    expect(settings.nested.list.map((item) => item.toUpperCase())).toEqual(['A', 'B'])
    expect(settings.nested).toBe(settings.nested)
  })

  it('reads a frozen list of objects, still read-only', () => {
    setDrupalSettings('default', { public: { testFrozen: Object.freeze([Object.freeze({ on: true })]) } })
    const settings = useDruxtSettings() as unknown as { testFrozen: Array<{ on: boolean }> }
    expect(settings.testFrozen[0]).toEqual({ on: true })
    expect(settings.testFrozen.map((item) => item.on)).toEqual([true])
    expect(() => settings.testFrozen.push({ on: false })).toThrow(TypeError)
    expect(() => { settings.testFrozen[0]!.on = false }).toThrow(TypeError)
  })

  it('cannot be made non-extensible, so its keys still read after a tier is set', () => {
    const settings = useDruxtSettings()
    expect(Reflect.preventExtensions(settings)).toBe(false)
    setDrupalSettings('default', { public: { nested: { list: ['a'] }, afterwards: true } })
    expect(Object.keys(settings)).toContain('afterwards')
    const nested = (settings as unknown as { nested: object }).nested
    expect(Reflect.preventExtensions(nested)).toBe(false)
    expect(Object.keys(nested)).toEqual(['list'])
  })

  it('renders again when a tier is set after the component read its settings', async () => {
    const Reader = defineComponent({
      setup() {
        const settings = useDruxtSettings()
        const late = computed(() => settings.late)
        return () => h('p', String(late.value ?? 'unset'))
      },
    })
    const wrapper = await mountSuspended(Reader)
    expect(wrapper.text()).toBe('unset')
    setDrupalSettings('default', { public: { late: 'set later' } })
    await nextTick()
    expect(wrapper.text()).toBe('set later')
  })

  it('merges a fetched public tier over the stored one, replacing arrays, and keeps the stored keys it does not set', () => {
    // As the server's plugin leaves it from storeDrupalSettings().
    fromDrupal().value = { stored: 'kept', router: { wildcard: true, canonical: false }, list: ['a', 'b'] }
    setDrupalSettings('default', { public: { fetched: 'added', router: { canonical: true }, list: ['c'] } })
    expect(fromDrupal().value).toEqual({ stored: 'kept', fetched: 'added', router: { wildcard: true, canonical: true }, list: ['c'] })
    expect(useDruxtSettings()).toMatchObject({ stored: 'kept', fetched: 'added' })
  })

  it('replaces the public tier when asked', () => {
    fromDrupal().value = { stored: 'dropped' }
    setDrupalSettings('default', { public: { fetched: 'only' } }, { replace: true })
    expect(fromDrupal().value).toEqual({ fetched: 'only' })
  })

  it('in the browser, writes the public tier to state and drops the server tier', () => {
    setDrupalSettings('default', { public: { shown: 'public' }, server: { hidden: 'server-only' } })
    expect(fromDrupal().value).toEqual({ shown: 'public' })
    expect(JSON.stringify(useNuxtApp().payload.state)).not.toContain('server-only')
    expect(useDruxtSettings()).not.toHaveProperty('hidden')
  })

  it('resolves another connection name to the default, warning once in development', () => {
    fromDrupal().value = { fromDrupal: 'default' }
    expect(useDruxtSettings('shop').fromDrupal).toBe('default')
    useDruxtSettings('shop')
    const warnings = output.filter((line) => line.includes('"shop"'))
    expect(warnings).toHaveLength(1)
  })
})

import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadNuxt, logger } from 'nuxt/kit'
import type { Nuxt, NuxtModule } from 'nuxt/schema'
import { describe, expect, it } from 'vitest'
import { requireDruxtAnchors } from '../../packages/core/src/kit'
import type { DruxtAnchorsState } from '../../packages/core/src/anchors'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** A module that requires anchors, keeping the state it got back. */
const requiring = (name: string, reason: string, kept: Record<string, Readonly<DruxtAnchorsState>>): NuxtModule => ((_options: unknown, nuxt: Nuxt) => {
  kept[name] = requireDruxtAnchors(nuxt, { module: name, reason })
}) as unknown as NuxtModule

/**
 * Sets the app up, as `nuxt prepare` does, with the modules given in order, and returns what the app reads through
 * `useDruxtAnchors()`, the `druxt:anchors` hook's calls, and the build's warnings about anchors.
 *
 * @param options - Development or production, the site's `druxt.anchors`, and the modules in order.
 * @param options.dev - Whether the app runs in development.
 * @param options.anchors - The site's `druxt.anchors`, unset when not given.
 * @param options.modules - The modules, @druxt/core among them.
 */
const load = async ({ dev = false, anchors, modules = ['@druxt/core'] }: { dev?: boolean, anchors?: unknown, modules?: Array<string | NuxtModule | [string, Record<string, unknown>]> }) => {
  const warnings: string[] = []
  const reporter = { log: (log: { type: string, args: unknown[] }) => { if (log.type === 'warn') warnings.push(log.args.join(' ')) } }
  const calls: DruxtAnchorsState[] = []
  const listen = ((_options: unknown, nuxt: Nuxt) => { nuxt.hook('druxt:anchors', (state) => { calls.push(state) }) }) as unknown as NuxtModule
  logger.addReporter(reporter)
  let nuxt: Nuxt | undefined
  try {
    nuxt = await loadNuxt({
      cwd: join(root, 'test/unit/fixtures/anchors'),
      ready: true,
      dev,
      overrides: { _prepare: true, modules: [listen, ...modules], ...(anchors === undefined ? {} : { druxt: { baseUrl: 'https://drupal.test', anchors } }) } as Record<string, unknown>,
    })
    const template = nuxt.options.build.templates.find((entry) => entry.filename === 'druxt/anchors.mjs')!
    const contents = await (template.getContents as (data: unknown) => string | Promise<string>)({ nuxt, app: {}, options: {} })
    const runtime = JSON.parse(/^export default (.*)$/m.exec(contents)![1]!) as DruxtAnchorsState
    const site = /^export const site = (true|false)$/m.exec(contents)![1] === 'true'
    return { runtime, site, calls, warnings: warnings.filter((line) => line.includes('anchors')) }
  } finally {
    logger.removeReporter(reporter)
    await nuxt?.close()
  }
}

describe('druxt.anchors at build', () => {
  it('is off in production by default, and the app reads it off', async () => {
    const { runtime, site, calls, warnings } = await load({})
    expect(runtime).toEqual({ enabled: false, requiredBy: [] })
    expect(site).toBe(false)
    expect(calls).toEqual([{ enabled: false, requiredBy: [] }])
    expect(warnings).toEqual([])
  }, 120_000)

  it('is on in development without any module requiring it', async () => {
    expect((await load({ dev: true })).runtime).toEqual({ enabled: true, requiredBy: [] })
  }, 120_000)

  it('is on in production once a module requires it, which the app and the hook name', async () => {
    const kept: Record<string, Readonly<DruxtAnchorsState>> = {}
    const { runtime, calls } = await load({ modules: ['@druxt/core', requiring('@druxt/site', 'its pages link editors to fields', kept)] })
    expect(runtime).toEqual({ enabled: true, requiredBy: ['@druxt/site'] })
    expect(calls).toEqual([{ enabled: true, requiredBy: ['@druxt/site'] }])
    expect(kept['@druxt/site']).toEqual({ enabled: true, requiredBy: ['@druxt/site'] })
  }, 120_000)

  it('names two requiring modules', async () => {
    const kept: Record<string, Readonly<DruxtAnchorsState>> = {}
    const { runtime } = await load({ modules: ['@druxt/core', requiring('@druxt/site', 'a', kept), requiring('@druxt-contrib/fae', 'b', kept)] })
    expect(runtime.requiredBy).toEqual(['@druxt/site', '@druxt-contrib/fae'])
  }, 120_000)

  it('keeps the site\'s explicit false over a requiring module, and warns once for each, naming it and its reason', async () => {
    const kept: Record<string, Readonly<DruxtAnchorsState>> = {}
    const { runtime, site, calls, warnings } = await load({
      anchors: false,
      modules: ['@druxt/core', requiring('@druxt-contrib/fae', 'it finds the fields an editor edits', kept), requiring('@druxt/site', 'its pages link editors to fields', kept)],
    })
    const state = { enabled: false, requiredBy: ['@druxt-contrib/fae', '@druxt/site'], disabledBy: 'site' }
    expect(runtime).toEqual(state)
    expect(site).toBe(true)
    expect(calls).toEqual([state])
    // The value each module got back, read once every module is in.
    expect(kept['@druxt-contrib/fae']).toEqual(state)
    expect(warnings).toHaveLength(2)
    expect(warnings[0]).toMatch(/@druxt-contrib\/fae requires Druxt anchors, as it finds the fields an editor edits, but `druxt\.anchors` is false/)
    expect(warnings[1]).toMatch(/@druxt\/site requires Druxt anchors, as its pages link editors to fields/)
  }, 120_000)

  // The module that runs before core sees the site's false only once core has read it: the state it holds is the
  // build's own, so it ends the same as the one that runs after.
  it('settles the same for a module that requires anchors before core reads the site\'s config, and one after', async () => {
    const kept: Record<string, Readonly<DruxtAnchorsState>> = {}
    await load({ modules: [requiring('before', 'a', kept), ['@druxt/core', { anchors: false }], requiring('after', 'b', kept)] })
    expect(kept.before).toEqual({ enabled: false, requiredBy: ['before', 'after'], disabledBy: 'site' })
    expect(kept.after).toBe(kept.before)
  }, 120_000)

  it('turns them on in production for an explicit true', async () => {
    expect((await load({ anchors: true })).runtime).toEqual({ enabled: true, requiredBy: [] })
  }, 120_000)
})

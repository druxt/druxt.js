import { describe, expect, it, vi } from 'vitest'
import { loadDruxtTools, missingToolsMessages } from '../../packages/core/src/utils/devtools'

/** An import that fails as Node fails a package that is not installed. */
const notInstalled = (name: string, importer = '/app/node_modules/@druxt/core/dist/module.mjs') => Object.assign(new Error(`Cannot find package '${name}' imported from ${importer}`), { code: 'ERR_MODULE_NOT_FOUND' })

/** The same failure as jiti, which loads a module in development, throws it. */
const notInstalledJiti = (name: string, importer = '/app/node_modules/@druxt/core/dist/module.mjs') => Object.assign(new Error(`Cannot find module '${name}'\nRequire stack:\n- ${importer}`), { code: 'MODULE_NOT_FOUND' })

describe('loading the optional development tools', () => {
  it('skips a package that is not installed, quietly', async () => {
    const logger = { error: vi.fn() }
    const tools = await loadDruxtTools(async (name) => { throw notInstalled(name) }, logger)
    expect(tools).toEqual({ druxt: undefined, kit: undefined, vue: false })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('logs any other failure as an error, and skips that package', async () => {
    const logger = { error: vi.fn() }
    const druxt = { druxtTabIconSvg: () => '<svg />' }
    const broken = new SyntaxError('Unexpected token')
    const tools = await loadDruxtTools(async (name) => {
      if (name === '@druxt/devtools') return druxt
      if (name === '@nuxt/devtools-kit') throw broken
      // A dependency of an installed package that is missing is not the package itself missing.
      throw notInstalled('@vue/devtools-kit')
    }, logger)
    expect(tools).toEqual({ druxt, kit: undefined, vue: false })
    expect(logger.error.mock.calls).toEqual([['@nuxt/devtools-kit could not be loaded:', broken], ['@vue/devtools-api could not be loaded:', expect.objectContaining({ code: 'ERR_MODULE_NOT_FOUND' })]])
  })

  it('skips a package jiti reports as not installed, quietly', async () => {
    const logger = { error: vi.fn() }
    const tools = await loadDruxtTools(async (name) => { throw notInstalledJiti(name) }, logger)
    expect(tools).toEqual({ druxt: undefined, kit: undefined, vue: false })
    expect(logger.error).not.toHaveBeenCalled()
  })

  // The importer is the installed package itself, so its name is in the message: only the missing specifier counts.
  it('logs a missing dependency of an installed package as an error, from Node or from jiti', async () => {
    for (const fail of [notInstalled, notInstalledJiti]) {
      const logger = { error: vi.fn() }
      await loadDruxtTools(async (name) => {
        if (name === '@druxt/devtools') throw fail('@vue/devtools-kit', '/app/node_modules/@druxt/devtools/dist/index.mjs')
        throw fail(name)
      }, logger)
      expect(logger.error.mock.calls.map(([message]) => message)).toEqual(['@druxt/devtools could not be loaded:'])
    }
  })

  it('says to add @druxt/devtools when it is missing, and what Nuxt DevTools would use when that is', () => {
    const druxt = { druxtTabIconSvg: () => '<svg />' }
    expect(missingToolsMessages({ vue: true }, true)).toEqual(['Add @druxt/devtools as a dev dependency for the Druxt tab in Nuxt DevTools, Vue DevTools and the console summary.'])
    expect(missingToolsMessages({ druxt, vue: false }, true)).toEqual([
      'Add @nuxt/devtools-kit as a dev dependency for the Druxt tab in Nuxt DevTools.',
      'Add @vue/devtools-api as a dev dependency for the Druxt inspector and timeline in Vue DevTools.',
    ])
    // Without Nuxt DevTools in the app, neither is missed.
    expect(missingToolsMessages({ druxt, vue: false }, false)).toEqual([])
  })
})

import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const DRUPAL = 'https://drupal.example.com/d'
const HOST = 'drupal.example.com'

const runtime = vi.hoisted(() => ({ config: {} as { public: { druxt?: Record<string, unknown> }, app?: Record<string, unknown> } }))

vi.mock('nitropack/runtime', () => ({ defineNitroPlugin: (plugin: unknown) => plugin, useRuntimeConfig: () => runtime.config }))
vi.mock('#imports', () => ({ defineNuxtPlugin: (plugin: unknown) => plugin, useRuntimeConfig: () => runtime.config }))
vi.mock('@druxt/core/routes', () => import('../../packages/core/src/routes'))

// Nuxt's own writer of the page's config, in the Nuxt installed here, and the serializer it calls. The statement is
// read from Nuxt's source, so a Nuxt that writes the config another way fails these tests, where the plugins would
// otherwise leave the address in the page with no word.
const installed = fileURLToPath(new URL('../../node_modules', import.meta.url))
// The file that statement is in has moved between Nuxt releases, so each place it has been is tried.
const renderer = ['nuxt/dist/runtime/server/renderer/payload.js', '@nuxt/nitro-server/dist/runtime/utils/renderer/payload.mjs']
  .map((path) => join(installed, path))
  .find((path) => existsSync(path)) ?? ''
const statement = /`(window\.__NUXT__=\{\};window\.__NUXT__\.config=)\$\{config\}`/.exec(readFileSync(renderer, 'utf8'))?.[1]
const { uneval } = await import(pathToFileURL(createRequire(renderer).resolve('devalue')).href) as { uneval: (value: unknown) => string }

/** The script Nuxt writes a page's config in. */
const configScript = (config: unknown): string => `<script>${statement}${uneval(config)}</script>`

/** A public config whose `druxt.baseUrl` is Drupal's address. */
const config = (hidden: boolean) => ({ public: { druxt: { baseUrl: DRUPAL, endpoint: '/jsonapi', ...(hidden ? { baseUrlHidden: true } : {}) } }, app: { baseURL: '/', buildId: 'b1' } })

type Hook = (...args: never[]) => unknown

/** What a plugin hooked, by name. */
const hooks = () => {
  const hooked: Record<string, Hook> = {}
  return { hooked, hook: (name: string, fn: Hook) => { hooked[name] = fn } }
}

describe('Nuxt\'s page config, as the installed Nuxt writes it', () => {
  it('is written in the statement the plugins look for, with the base URL as a quoted string', () => {
    expect(statement).toBe('window.__NUXT__={};window.__NUXT__.config=')
    expect(configScript(config(true))).toContain(`baseUrl:${JSON.stringify(DRUPAL)}`)
  })
})

describe('the Nitro plugin that hides Drupal\'s address in a page with no server render', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  /** The page's parts, as Nuxt gives them to `render:html`, after the plugin's hook ran. */
  const render = async (hidden: boolean) => {
    runtime.config = config(hidden)
    const { default: plugin } = await import('../../packages/core/src/runtime/server/plugins/origin')
    const { hooked, hook } = hooks()
    ;(plugin as unknown as (nitroApp: unknown) => void)({ hooks: { hook } })
    const html = {
      htmlAttrs: [],
      head: ['<meta charset="utf-8">', configScript(runtime.config)],
      bodyAttrs: [],
      bodyPrepend: [configScript(runtime.config)],
      body: ['<div id="__nuxt"></div>'],
      bodyAppend: [configScript(runtime.config)],
    }
    await (hooked['render:html'] as unknown as (html: unknown, context: unknown) => unknown)(html, { event: {} })
    return [...html.head, ...html.bodyPrepend, ...html.body, ...html.bodyAppend].join('')
  }

  it('leaves no part of the page holding the address, wherever Nuxt wrote the config', async () => {
    const page = await render(true)
    expect(page).not.toContain(HOST)
    expect(page).toContain('baseUrl:"/d"')
    expect(page).toContain('baseUrlHidden:true')
  })

  it('leaves the page as it is when the browser uses the address', async () => {
    expect(await render(false)).toContain(`baseUrl:${JSON.stringify(DRUPAL)}`)
  })
})

describe('the app plugin that hides Drupal\'s address in a rendered page', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  /** The config script Nuxt writes from the render's context, after the plugin's hook ran, and the server's config. */
  const render = async (hidden: boolean) => {
    runtime.config = config(hidden)
    const { default: plugin } = await import('../../packages/core/src/runtime/plugins/origin.server')
    const { hooked, hook } = hooks()
    ;(plugin as unknown as { setup: (nuxtApp: unknown) => void }).setup({ hook })
    // Nuxt gives a render the config the server reads.
    const ssrContext = { config: runtime.config as unknown }
    ;(hooked['app:rendered'] as unknown as ((context: unknown) => void) | undefined)?.({ ssrContext })
    return { page: configScript(ssrContext.config), server: runtime.config }
  }

  it('gives the page a config with no address, and leaves the server\'s config as it was', async () => {
    const { page, server } = await render(true)
    expect(page).not.toContain(HOST)
    expect(page).toContain('baseUrl:"/d"')
    expect(page).toContain('endpoint:"/jsonapi"')
    expect(server.public.druxt?.baseUrl).toBe(DRUPAL)
  })

  it('leaves the page\'s config as it is when the browser uses the address', async () => {
    expect((await render(false)).page).toContain(`baseUrl:${JSON.stringify(DRUPAL)}`)
  })
})

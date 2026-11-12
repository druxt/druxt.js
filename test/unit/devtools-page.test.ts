// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createDruxtDevtools, defineDruxtDevtoolsElement } from '../../packages/devtools/src'
import type { DruxtDevtoolsElement } from '../../packages/devtools/src'
import { DRUXT_DEVTOOLS_ICON_ROUTE, DRUXT_DEVTOOLS_ROUTE, devtoolsPage, devtoolsTab } from '../../packages/core/src/utils/devtools'
import { module } from './devtools-fixtures'

/** Loads the tab's page into this window, as the DevTools frame would, and runs its script. */
const load = () => {
  const page = devtoolsPage()
  document.body.innerHTML = /<body>([\s\S]*)<script>/.exec(page)![1]!
  new Function(/<script>([\s\S]*)<\/script>/.exec(page)![1]!)()
}

/** The client Nuxt DevTools gives a custom tab's frame. */
const client = (colorMode = 'dark') => {
  const channel = createDruxtDevtools()
  channel.emit({ type: 'module:missing', module: module('1') })
  return { value: { devtools: { colorMode }, host: { nuxt: { $druxtDevtools: { channel, define: defineDruxtDevtoolsElement, createEndpoint: '/api/_druxt/template', openInEditor: () => {} } }, hooks: { hook: () => {} } } } }
}

describe('the Nuxt DevTools tab\'s page', () => {
  afterEach(() => {
    delete (window as { __NUXT_DEVTOOLS__?: unknown }).__NUXT_DEVTOOLS__
    history.replaceState(null, '', '/')
  })

  it('is served at /__druxt/devtools, and waits for DevTools to connect it to the app', () => {
    expect(DRUXT_DEVTOOLS_ROUTE).toBe('/__druxt/devtools')
    load()
    expect(document.getElementById('waiting')!.textContent).toContain('Open this from the Druxt tab in Nuxt DevTools')
    expect(document.querySelector('druxt-devtools')).toBeNull()
  })

  // Nuxt DevTools shows an image only for an icon that starts with `/` or `http`, and takes any other string as a class.
  it('registers the tab with its icon as a path on the dev server, beside the page', () => {
    const tab = devtoolsTab()
    expect(tab.icon).toBe(DRUXT_DEVTOOLS_ICON_ROUTE)
    expect(tab.icon.startsWith('/')).toBe(true)
    expect(tab.view).toEqual({ type: 'iframe', src: DRUXT_DEVTOOLS_ROUTE })
  })

  it('mounts the element on the app\'s channel once DevTools gives the frame its client, in DevTools\' colour mode', () => {
    history.replaceState(null, '', '/__druxt/devtools#modules')
    load()
    const { value } = client()
    ;(window as { __NUXT_DEVTOOLS__?: unknown }).__NUXT_DEVTOOLS__ = value
    const element = document.querySelector('druxt-devtools') as DruxtDevtoolsElement
    expect(element.getAttribute('theme')).toBe('dark')
    expect(element.section).toBe('modules')
    expect(element.createEndpoint).toBe('/api/_druxt/template')
    expect(element.shadowRoot!.querySelector('.dt-module code')!.textContent).toBe('DruxtEntity')
    expect(document.getElementById('waiting')).toBeNull()
  })

  it('keeps the section in the frame\'s URL, so a reload returns to it', () => {
    load()
    ;(window as { __NUXT_DEVTOOLS__?: unknown }).__NUXT_DEVTOOLS__ = client('light').value
    const element = document.querySelector('druxt-devtools') as DruxtDevtoolsElement
    expect(element.getAttribute('theme')).toBe('light')
    element.shadowRoot!.querySelector<HTMLElement>('#dt-tab-requests')!.click()
    expect(location.hash).toBe('#requests')
  })

  it('takes a client DevTools set before the script ran', () => {
    ;(window as { __NUXT_DEVTOOLS__?: unknown }).__NUXT_DEVTOOLS__ = client().value
    load()
    expect(document.querySelector('druxt-devtools')).not.toBeNull()
  })
})

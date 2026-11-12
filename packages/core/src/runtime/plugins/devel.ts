import { toRaw, watch } from 'vue'
import { createDruxtDevtools, defineDruxtDevtoolsElement, watchDruxtDevtoolsSummary } from '@druxt/devtools'
import type { DruxtDevtoolsAction as ToolsAction, DruxtDevtoolsBlock as ToolsBlock, DruxtDevtoolsChannel, DruxtDevtoolsNote as ToolsNote, DruxtDevtoolsRequest } from '@druxt/devtools'
import { defineNuxtPlugin, useState } from '#app'
import { DRUXT_API_BASE } from '@druxt/core/routes'
import anchors, { site as siteAnchors } from '#build/druxt/anchors.mjs'
import { nuxtDevtools, vueDevtools } from '#build/druxt/devtools.mjs'
import { refreshDevtoolsSections, setDevtoolsOrigin } from '../devel/utils/sections'
import { anchorsSettings, moduleInstances, settingsWithTiers } from '../devel/utils/devtools'
import { setDruxtDevtools } from '../devel/utils/channel'
import { captureRequests, createPageGuard, recordRequest, requestKind, requestPath, setRequestRecorder } from '../devel/utils/requests'
import { DRUXT_DEVTOOLS_REQUESTS_KEY } from './devel-requests'
import { DRUXT_E_AUTH_SCOPE, watchScopeRefusals } from '../devel/utils/scope'
import type { DruxtDevtoolsAction, DruxtDevtoolsBlock, DruxtDevtoolsNote } from '../devel/types'
import { settingsOnly } from '../utils/drupal-settings'
import { useDruxtSettings, useDruxtSettingsTiers } from '../settings'

// Core's own copies of the tools' types, for its public API, match @druxt/devtools' in both directions: a change to one
// that the other does not make fails the typecheck here.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
const typesMatch: [Same<DruxtDevtoolsBlock, ToolsBlock>, Same<DruxtDevtoolsAction, ToolsAction>, Same<DruxtDevtoolsNote, ToolsNote>] = [true, true, true]
void typesMatch

/** What the Nuxt DevTools tab's frame reads from the app, as `nuxtApp.$druxtDevtools`. */
export interface DruxtDevtoolsHost {
  /** The channel the tab connects its element to. */
  channel: DruxtDevtoolsChannel
  /** Defines `<druxt-devtools>` in the tab's window. */
  define: typeof defineDruxtDevtoolsElement
  /** Where the create action posts. */
  createEndpoint: string
  /** Opens a created file in the editor, through Vite's endpoint. */
  openInEditor: (file: string) => void
}

/**
 * The development tools, in the browser, in development only, and only with `@druxt/devtools` installed: the channel
 * the Nuxt DevTools tab reads, the Vue DevTools inspector and timeline, the requests, the resolved settings, and a
 * console summary. Nothing is added to the page.
 */
export default defineNuxtPlugin({
  name: 'druxt-devel',
  dependsOn: ['druxt'],
  setup(nuxtApp) {
    const channel = createDruxtDevtools()
    setDruxtDevtools(channel)
    const client = nuxtApp.$druxt

    // The page, then the server render's requests from the payload, then the browser's as they come. The server rendered
    // this page, so its requests all show now. Later, they show again only on the page each was made for.
    channel.emit({ type: 'page', path: window.location.pathname + window.location.search })
    const serverRequests = useState<DruxtDevtoolsRequest[]>(DRUXT_DEVTOOLS_REQUESTS_KEY, () => [])
    const replayServerRequests = (page?: string) => {
      for (const request of serverRequests.value) {
        if (page === undefined || request.page === page) channel.emit({ type: 'request', request })
      }
    }
    replayServerRequests()
    // The page's start on the browser's clock: the latest navigation's.
    let origin = performance.now()
    setDevtoolsOrigin(origin)
    let count = 0
    setRequestRecorder(client, (record) => {
      channel.emit({ type: 'request', request: { id: `browser:${++count}`, side: 'browser', start: performance.now() - origin, duration: 0, ...record } })
    })
    captureRequests(client, () => origin)
    // A read the sign-in's scope refused, which an anonymous visitor may make: named once, with the setting to fix it.
    let scopeNoted = false
    watchScopeRefusals(client, (path) => {
      const summary = `${DRUXT_E_AUTH_SCOPE}: Drupal refused ${path} to the signed-in visitor, and gives it to an anonymous one. On Simple OAuth 6 a token holds only the roles its scopes name: set druxt.auth.scope to the scopes of the roles your editors need.`
      channel.emit({ type: 'quiet', error: { id: 'auth-scope', component: 'DruxtAuth', summary } })
      if (!scopeNoted) console.warn(`[druxt] ${summary}`)
      scopeNoted = true
    })
    // From the first navigation after hydration to another page: hydration's own, and a navigation to the page already
    // shown, such as to a hash in it, keep the server render's requests. The page shown is the router's, read once
    // mounted, so the app's base URL is not part of it.
    let isNewPage: ReturnType<typeof createPageGuard> | undefined
    nuxtApp.hook('app:mounted', () => { isNewPage = createPageGuard(nuxtApp.$router.currentRoute.value.fullPath) })
    // A new page starts its own list. The server render's requests show on the page they were made for, so a
    // navigation back to it, by the visitor or the app, shows them again, and any other page never does.
    nuxtApp.$router.beforeEach((to) => {
      const path = isNewPage?.(to.fullPath)
      if (!path) return
      origin = performance.now()
      setDevtoolsOrigin(origin)
      channel.emit({ type: 'page', path })
      replayServerRequests(path)
    })
    // Module sections read their data again on each page and as modules report.
    let pending: ReturnType<typeof setTimeout> | undefined
    channel.subscribe((event) => {
      if (event.type !== 'page' && !event.type.startsWith('module:')) return
      clearTimeout(pending)
      pending = setTimeout(() => refreshDevtoolsSections(channel), 100)
    })
    // The schema and date format routes are the site's own, fetched with $fetch, not the client: read from the
    // browser's resource timing.
    if (typeof PerformanceObserver === 'function') {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
          if (!['schema', 'date-formats'].some((route) => entry.name.includes(`${DRUXT_API_BASE}/${route}/`))) continue
          const status = (entry as PerformanceResourceTiming & { responseStatus?: number }).responseStatus
          recordRequest(client, { kind: requestKind(entry.name), path: requestPath(entry.name), source: 'network', start: entry.startTime - origin, duration: entry.duration, ...(status ? { status } : {}) })
        }
      })
      try {
        observer.observe({ type: 'resource', buffered: true })
      } catch {
        // A browser without resource timing lists the client's requests only.
      }
    }

    // The resolved settings, each with the tier it came from, again whenever Drupal's tier changes, then the anchors
    // state the build settled and the modules that required it.
    const settings = useDruxtSettings()
    const { drupal, site } = useDruxtSettingsTiers()
    watch(drupal, () => {
      channel.emit({ type: 'settings', settings: [...settingsWithTiers({ ...settings }, { drupal: settingsOnly(toRaw(drupal.value)), site }), ...anchorsSettings(anchors, siteAnchors)] })
    }, { immediate: true, deep: true })

    // Vue DevTools, when its API is installed: loaded on demand, without holding the app up. It reads what was reported
    // before it loaded from the snapshot.
    if (vueDevtools) {
      import('../devel/utils/vue-devtools')
        .then(({ setupDruxtVueDevtools }) => setupDruxtVueDevtools(nuxtApp.vueApp, channel, moduleInstances()))
        .catch((error) => console.warn('[druxt] Vue DevTools could not be set up:', error))
    }

    // Without DevTools, or alongside it, the console says what the tools would. Inline messages say it in the page.
    if (settings.develMessages !== 'inline') watchDruxtDevtoolsSummary(channel, nuxtDevtools ? { open: 'Nuxt DevTools > Druxt' } : {})

    const host: DruxtDevtoolsHost = {
      channel,
      define: defineDruxtDevtoolsElement,
      createEndpoint: `${DRUXT_API_BASE}/template`,
      // Vite's open-in-editor endpoint. Nothing is lost if there is none.
      openInEditor: (file) => { fetch(`/__open-in-editor?file=${encodeURIComponent(file)}`).catch(() => {}) },
    }
    return { provide: { druxtDevtools: host } }
  },
})

import type { DruxtDevtoolsRequest } from '@druxt/devtools'
import { defineNuxtPlugin, useState } from '#app'
import { captureRequests, pageOf, setRequestRecorder } from '../devel/utils/requests'

/** The server render's requests, carried to the browser in the payload. Development only, as this plugin is. */
export const DRUXT_DEVTOOLS_REQUESTS_KEY = 'druxt:devtools:requests'

/**
 * Records the server render's requests for the development tools, in development only: each request through the
 * client's request hook, with its timing, and each read the store answered, labelled with the page the render was for.
 * They go to the payload, and core's development plugin hands them to the tools in the browser while that page shows.
 */
export default defineNuxtPlugin({
  name: 'druxt-devtools-requests',
  dependsOn: ['druxt'],
  setup(nuxtApp) {
    const client = nuxtApp.$druxt
    const requests = useState<DruxtDevtoolsRequest[]>(DRUXT_DEVTOOLS_REQUESTS_KEY, () => [])
    const origin = performance.now()
    let count = 0
    // The page the render is for, as the browser's router names it: its path and query, without the base URL or a hash.
    const page = () => pageOf(nuxtApp.$router?.currentRoute.value.fullPath || nuxtApp.ssrContext?.url || '/')
    setRequestRecorder(client, (record) => {
      requests.value.push({ id: `server:${++count}`, side: 'server', start: performance.now() - origin, duration: 0, page: page(), ...record })
    })
    captureRequests(client, () => origin)
  },
})

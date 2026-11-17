import type { DruxtDevtoolsRequest } from '@druxt/devtools'
import { defineNuxtPlugin, useState } from '#app'
import { captureRequests, pageOf, setRequestRecorder } from '../devel/utils/requests'

/** The state key of the server render's requests. The payload carries them to the browser. Development only. */
export const DRUXT_DEVTOOLS_REQUESTS_KEY = 'druxt:devtools:requests'

/**
 * Records the server render's requests for the development tools. Development only.
 *
 * It records each request through the client's request hook, with its timing, and each read the store answered.
 * Each is labelled with the page the render was for.
 *
 * They go to the payload. Core's development plugin hands them to the tools in the browser while that page shows.
 */
export default defineNuxtPlugin({
  name: 'druxt-devtools-requests',
  dependsOn: ['druxt'],
  setup(nuxtApp) {
    const client = nuxtApp.$druxt
    const requests = useState<DruxtDevtoolsRequest[]>(DRUXT_DEVTOOLS_REQUESTS_KEY, () => [])
    const origin = performance.now()
    let count = 0
    // The page the render is for, as the browser's router names it. It is the path and query, without the base URL
    // or a hash.
    const page = () => pageOf(nuxtApp.$router?.currentRoute.value.fullPath || nuxtApp.ssrContext?.url || '/')
    setRequestRecorder(client, (record) => {
      requests.value.push({ id: `server:${++count}`, side: 'server', start: performance.now() - origin, duration: 0, page: page(), ...record })
    })
    captureRequests(client, () => origin)
  },
})

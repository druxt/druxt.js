import { createHash, timingSafeEqual } from 'node:crypto'
import { defineEventHandler, getRequestHeader, setResponseHeader, setResponseStatus } from 'h3'
import { resetProcessCache } from '@druxt/client'
import { useNitroApp } from 'nitropack/runtime'
import { useRuntimeConfig } from '#imports'
import type { DruxtPrivateConfig } from '../../types'
import { clearServerClients } from '../signIn'

// Digests first, so the comparison takes the same time whatever either length.
const digest = (value: string) => createHash('sha256').update(value).digest()

/**
 * POST /api/_druxt/cache/clear: empties the process cache and the server clients'
 * caches when Drupal asks, then tells the modules through `druxt:cache:clear`.
 *
 * The secret comes in the `X-Druxt-Secret` header, never the URL, so it stays
 * out of access logs. As 1.x's server middleware.
 */
export default defineEventHandler(async (event) => {
  const secret = (useRuntimeConfig(event).druxt as Partial<DruxtPrivateConfig> | undefined)?.cache?.secret
  // Registered while the secret may still arrive at runtime: without one, there is no route.
  if (!secret) {
    setResponseStatus(event, 404)
    return ''
  }

  if (event.method !== 'POST') {
    setResponseHeader(event, 'Allow', 'POST')
    setResponseStatus(event, 405)
    return ''
  }

  if (!timingSafeEqual(digest(getRequestHeader(event, 'x-druxt-secret') || ''), digest(secret))) {
    setResponseStatus(event, 401)
    return ''
  }

  resetProcessCache()
  // The server routes' clients keep a JSON:API index each.
  await clearServerClients()
  // The modules' own holds, such as regenerated schemas, go with it.
  await useNitroApp().hooks.callHook('druxt:cache:clear')
  setResponseStatus(event, 204)
  return ''
})

declare module 'nitropack' {
  interface NitroRuntimeHooks {
    /** Druxt's caches were cleared through `/api/_druxt/cache/clear`. */
    'druxt:cache:clear': () => void | Promise<void>
  }
}

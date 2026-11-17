import { createHash, timingSafeEqual } from 'node:crypto'
import { defineEventHandler, getRequestHeader, setResponseHeader, setResponseStatus } from 'h3'
import { resetProcessCache } from '@druxt/client'
import { useNitroApp } from 'nitropack/runtime'
import { useRuntimeConfig } from '#imports'
import type { DruxtPrivateConfig } from '../../types'
import { clearServerClients } from '../signIn'

// Both values are digested first, so the comparison takes the same time whatever the length of either.
const digest = (value: string) => createHash('sha256').update(value).digest()

/**
 * POST /api/_druxt/cache/clear: empties the caches when Drupal asks.
 *
 * It empties the process cache and the server clients' caches. Then it tells the modules through the
 * `druxt:cache:clear` hook.
 *
 * The secret comes in the `X-Druxt-Secret` header, never in the URL, so it stays out of access logs. 1.x's server
 * middleware did the same.
 *
 * It answers 404 with no secret set, 405 to a method other than `POST`, 401 to a wrong secret, and 204 once the
 * caches are cleared.
 */
export default defineEventHandler(async (event) => {
  const secret = (useRuntimeConfig(event).druxt as Partial<DruxtPrivateConfig> | undefined)?.cache?.secret
  // The route is registered while the secret may still arrive at runtime. Without a secret it answers as no route.
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
  // Each of the server routes' clients keeps a JSON:API index.
  await clearServerClients()
  // The modules' own holds, such as regenerated schemas, are cleared with it.
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

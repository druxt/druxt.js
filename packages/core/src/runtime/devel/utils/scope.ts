import type { DruxtClient } from '@druxt/client'

/** The code the scope note and warning name. */
export const DRUXT_E_AUTH_SCOPE = 'DRUXT_E01004'

/**
 * Watches for the sign-in's scope gap: a read Drupal refused the signed-in visitor with a 403 that it gives an
 * anonymous visitor. On Simple OAuth 6 a token holds only the roles its scopes name, so a sign-in with no
 * `druxt.auth.scope` reads less than anonymous. Each refused path is read again once, without credentials, and
 * reported when that read succeeds. Development only: the caller is the development plugin.
 *
 * @param client - The browser's client.
 * @param report - Called with the path, without its origin, of each read the scope refused.
 * @returns The function that stops watching.
 */
export const watchScopeRefusals = (client: DruxtClient, report: (path: string) => void): (() => void) => {
  const probed = new Set<string>()
  return client.onRequest(async (event) => {
    if (event.type !== 'end' || event.status !== 403 || event.method !== 'GET' || !client.auth?.loggedIn) return
    const url = new URL(event.url, 'http://druxt.invalid')
    const path = `${url.pathname}${url.search}`
    if (probed.has(path)) return
    probed.add(path)
    const anonymous = await client.request(event.url, { auth: false, validateStatus: () => true }).catch(() => undefined)
    if (anonymous && anonymous.status >= 200 && anonymous.status < 300) report(path)
  })
}

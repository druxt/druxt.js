// What a request listener is given: URLs without secrets. Also the console, tagged for the client.
import type { DruxtLogger } from '../types'

// The query keys whose values a request listener never sees: the tokens, codes and secrets a URL can carry.
const SECRET_QUERY_KEYS = new Set(['token', 'access_token', 'code', 'password', 'client_secret'])

/**
 * Removes the secrets from a URL before a request listener sees it.
 *
 * The user name and password are removed, and the values of the secret query keys are emptied. Other query values
 * pass as sent. A URL with nothing to remove is returned exactly as it was.
 *
 * @param href - The URL, absolute or a path.
 * @returns The URL without its secrets.
 */
export const listenerUrl = (href: string): string => {
  try {
    const absolute = /^[a-z][a-z\d+.-]*:/i.test(href)
    const url = new URL(href, 'http://druxt.invalid')

    // Nothing to remove: the listener sees the URL exactly as it was sent, with no re-encoding.
    if (
      !url.username
      && !url.password
      && ![...url.searchParams.keys()].some((key) => SECRET_QUERY_KEYS.has(key.toLowerCase()))
    ) return href

    url.username = ''
    url.password = ''
    for (const key of [...url.searchParams.keys()]) {
      if (SECRET_QUERY_KEYS.has(key.toLowerCase())) url.searchParams.set(key, '')
    }
    return absolute ? url.href : `${url.pathname}${url.search}${url.hash}`
  } catch {
    return href
  }
}

/** Tags a logger's messages with `[DruxtClient]`, as consola tags a logger. Used when no logger is given. */
export const prefixed = (log: DruxtLogger): DruxtLogger => ({
  info: (...args) => log.info('[DruxtClient]', ...args),
  warn: (...args) => log.warn('[DruxtClient]', ...args),
})

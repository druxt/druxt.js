// What a request listener is given: URLs without secrets, and the console tagged for the client.
import type { DruxtLogger } from '../types'

// The query keys whose values a request listener never sees: tokens, codes and secrets a URL can carry.
const SECRET_QUERY_KEYS = new Set(['token', 'access_token', 'code', 'password', 'client_secret'])

/**
 * A URL as a request listener sees it: without a user name or password, and with the values of secret query keys
 * emptied. Other query values pass as sent, and a URL with nothing to take out is returned as it was.
 *
 * @param href - The URL, absolute or a path.
 */
export const listenerUrl = (href: string): string => {
  try {
    const absolute = /^[a-z][a-z\d+.-]*:/i.test(href)
    const url = new URL(href, 'http://druxt.invalid')
    // Unchanged when there is nothing to take out, so the listener sees the URL exactly as it was sent.
    if (!url.username && !url.password && ![...url.searchParams.keys()].some((key) => SECRET_QUERY_KEYS.has(key.toLowerCase()))) return href
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

// The console, tagged as consola tags a logger, for when no logger is given.
export const prefixed = (log: DruxtLogger): DruxtLogger => ({
  info: (...args) => log.info('[DruxtClient]', ...args),
  warn: (...args) => log.warn('[DruxtClient]', ...args),
})

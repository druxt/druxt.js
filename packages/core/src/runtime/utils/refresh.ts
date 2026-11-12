// No #imports here: the app plugin and the unit tests both use this file.

/**
 * The refreshes running or just ended in this server process, by a digest of the session that spends them, never the
 * session's tokens themselves.
 */
const shared = new Map<string, { promise: Promise<unknown>, settledAt: number }>()

/** A SHA-256 digest of a session's key, in hex. */
const digest = async (session: string): Promise<string> => [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(session)))]
  .map((byte) => byte.toString(16).padStart(2, '0')).join('')

/**
 * Shares one refresh between the server renders of one browser, as the client's `auth.refresh.share`.
 *
 * Nuxt builds the app, and its client, once per server render, so a client's own shared refresh and grace period are
 * one render's. Several renders for one browser, such as tabs opening at once after Drupal revoked the access token,
 * hold the same refresh token, and Simple OAuth accepts it once: one render's refresh succeeds and the rest are
 * refused. Here a refresh lives for the server process, and every render of the same session takes its answer, while
 * it runs and for `grace` after it ends, a refused one too. Entries past their grace period go on the next refresh.
 * Sharing in memory covers one server process: a site running several still sees the race across them.
 *
 * @param session - The session's key, from the client, which holds its tokens.
 * @param start - Starts the refresh.
 * @param grace - How long, in milliseconds, a refresh that ended is still shared.
 * @returns The answer of the refresh this render started or joined.
 */
export const shareRefresh = async <T>(session: string, start: () => Promise<T>, grace: number): Promise<T> => {
  const key = await digest(session)
  const now = Date.now()
  for (const [name, entry] of shared) {
    if (entry.settledAt && now - entry.settledAt > grace) shared.delete(name)
  }
  const found = shared.get(key)
  if (found) return found.promise as Promise<T>

  const entry = { promise: Promise.resolve() as Promise<unknown>, settledAt: 0 }
  const settle = () => { entry.settledAt = Date.now() }
  const promise = start().then(
    (data) => {
      settle()
      return data
    },
    (error: unknown) => {
      settle()
      throw error
    },
  )
  entry.promise = promise
  shared.set(key, entry)
  return promise
}

// This file imports nothing from `#imports`, because the app plugin and the unit tests both use it.

/**
 * The refreshes running or just ended in this server process.
 *
 * They are keyed by a digest of the session that spends them, never by the session's tokens themselves.
 */
const shared = new Map<string, { promise: Promise<unknown>, settledAt: number }>()

/** A SHA-256 digest of a session's key, in hex. */
const digest = async (session: string): Promise<string> => [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(session)))]
  .map((byte) => byte.toString(16).padStart(2, '0')).join('')

/**
 * Shares one refresh between the server renders of one browser. It is the client's `auth.refresh.share`.
 *
 * The problem: Nuxt builds the app, and its client, once per server render. So a client's own shared refresh and
 * grace period cover one render. Several renders for one browser, such as tabs opening at once after Drupal revoked
 * the access token, hold the same refresh token. Simple OAuth accepts that token once. One render's refresh
 * succeeds, and the rest are refused.
 *
 * Here a refresh lives for the server process:
 *
 * - Every render of the same session takes its answer, while it runs and for `grace` after it ends.
 * - A refused refresh is shared the same way.
 * - Entries past their grace period are removed on the next refresh.
 *
 * Sharing in memory covers one server process. A site that runs several still sees the race across them.
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
